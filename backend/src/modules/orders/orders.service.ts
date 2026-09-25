import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateOrderInput,
  UpdateOrderStatusInput,
  CreateAddressInput,
  CouponValidationResponse,
  RequestReturnInput,
  UpdateReturnStatusInput,
} from './dto/orders.dto';
import { OrderStatus, PaymentMethod, PaymentStatus, InventoryAdjustmentReason, ReturnStatus } from '@prisma/client';

const FREE_DELIVERY_THRESHOLD = 999;
const FIXED_DELIVERY_FEE = 99;

const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  ORDER_PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const RETURN_STATUS_TRANSITIONS: Record<string, string[]> = {
  REQUESTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['PICKED_UP', 'REJECTED'],
  PICKED_UP: ['COMPLETED'],
  REJECTED: [],
  COMPLETED: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async validateCoupon(code: string, subtotal: number): Promise<CouponValidationResponse> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      return { isValid: false, message: 'Invalid or inactive coupon code' };
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return { isValid: false, message: 'Coupon code has expired' };
    }

    if (subtotal < coupon.minOrderVal) {
      return {
        isValid: false,
        message: `Minimum order amount of ₹${coupon.minOrderVal} required for coupon ${coupon.code}`,
      };
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (subtotal * coupon.discountVal) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountVal;
    }

    discountAmount = Math.min(discountAmount, subtotal);

    return {
      isValid: true,
      message: `Coupon ${coupon.code} applied successfully!`,
      discountAmount: Number(discountAmount.toFixed(2)),
    };
  }

  async createOrder(userId: string, input: CreateOrderInput) {
    const cart = await this.prisma.cart.findFirst({
      where: userId ? { userId } : { sessionId: input.sessionId },
      include: {
        items: {
          include: {
            product: { include: { inventory: true } },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Your cart is empty');
    }

    // Address verification
    const address = await this.prisma.address.findUnique({
      where: { id: input.addressId },
    });
    if (!address || address.userId !== userId) {
      throw new NotFoundException('Delivery address not found');
    }

    // Backend price, stock, and total recalculations (CRITICAL REQUIREMENT)
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of cart.items) {
      const stock = item.product.inventory?.stockQuantity || 0;
      if (stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for "${item.product.name}". Available: ${stock}`);
      }

      const finalUnitPrice = Math.round(item.product.price * (1 - item.product.discountPercent / 100));
      const itemTotal = finalUnitPrice * item.quantity;
      subtotal += itemTotal;

      orderItemsData.push({
        productId: item.productId,
        productName: item.product.name,
        unitPrice: finalUnitPrice,
        quantity: item.quantity,
        totalPrice: itemTotal,
      });
    }

    let discount = 0;
    if (input.couponCode) {
      const couponRes = await this.validateCoupon(input.couponCode, subtotal);
      if (couponRes.isValid) {
        discount = couponRes.discountAmount || 0;
      }
    }

    const deliveryFee = subtotal > 0 && subtotal < FREE_DELIVERY_THRESHOLD ? FIXED_DELIVERY_FEE : 0;
    const grandTotal = subtotal - discount + deliveryFee;

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // Database transaction: reserve stock, create order, payment, history, notification, and clear cart
    const order = await this.prisma.$transaction(async (tx) => {
      // 1. Decrement inventory
      for (const item of cart.items) {
        if (item.product.inventory) {
          await tx.inventory.update({
            where: { id: item.product.inventory.id },
            data: {
              stockQuantity: { decrement: item.quantity },
            },
          });

          await tx.inventoryTransaction.create({
            data: {
              inventoryId: item.product.inventory.id,
              quantityChange: -item.quantity,
              reason: InventoryAdjustmentReason.ORDER_RESERVATION,
              notes: `Stock reserved for order ${orderNumber}`,
              actorId: userId,
            },
          });
        }
      }

      // 2. Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId: address.id,
          subtotal,
          discount,
          deliveryFee,
          grandTotal,
          couponCode: input.couponCode || null,
          status: OrderStatus.ORDER_PLACED,
          items: {
            create: orderItemsData,
          },
          statusHistory: {
            create: {
              status: OrderStatus.ORDER_PLACED,
              notes: 'Order placed successfully by customer',
              actorId: userId,
            },
          },
          payments: {
            create: {
              transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              method: input.paymentMethod as PaymentMethod,
              status: input.paymentMethod === 'COD' ? PaymentStatus.PENDING : PaymentStatus.COMPLETED,
              amount: grandTotal,
            },
          },
        },
        include: {
          address: true,
          items: { include: { product: { include: { images: true, category: true } } } },
          statusHistory: true,
          payments: true,
        },
      });

      // 3. Clear Cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    await this.notificationsService.createNotification(
      userId,
      'Order Placed Successfully!',
      `Your order #${orderNumber} for ₹${grandTotal} has been placed.`,
      'ORDER_PLACED',
    );

    return order;
  }

  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        address: true,
        items: { include: { product: { include: { images: true, category: true } } } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        payments: true,
        returns: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(orderId: string, userId?: string, roles: string[] = []) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        address: true,
        items: { include: { product: { include: { images: true, category: true } } } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        payments: true,
        returns: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const isStaff = roles.some((r) => ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(r));
    if (userId && order.userId !== userId && !isStaff) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        address: true,
        user: true,
        items: { include: { product: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        payments: true,
        returns: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrderStatus(actorId: string, input: UpdateOrderStatusInput, actorRoles: string[] = []) {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      include: { items: true, payments: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const nextStatus = input.status as OrderStatus;
    const allowed = ORDER_STATUS_TRANSITIONS[order.status] || [];
    const isStaffOnly = actorRoles.includes('STAFF') && !actorRoles.some((r) => ['SUPER_ADMIN', 'ADMIN'].includes(r));

    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Cannot change order from ${order.status} to ${nextStatus}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    if (isStaffOnly && nextStatus === 'CANCELLED' && !['ORDER_PLACED', 'CONFIRMED', 'PACKED'].includes(order.status)) {
      throw new ForbiddenException('Staff cannot cancel an order after it has shipped');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (nextStatus === OrderStatus.CANCELLED) {
        for (const item of order.items) {
          const inventory = await tx.inventory.findUnique({ where: { productId: item.productId } });
          if (inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: { stockQuantity: { increment: item.quantity } },
            });
            await tx.inventoryTransaction.create({
              data: {
                inventoryId: inventory.id,
                quantityChange: item.quantity,
                reason: InventoryAdjustmentReason.ORDER_CANCELLED,
                notes: `Stock restored after cancelling ${order.orderNumber}`,
                actorId,
              },
            });
          }
        }

        for (const payment of order.payments) {
          if (payment.status === PaymentStatus.COMPLETED) {
            await tx.refund.create({
              data: {
                paymentId: payment.id,
                amount: payment.amount,
                reason: input.notes || 'Order cancelled',
                status: 'COMPLETED',
              },
            });
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: PaymentStatus.REFUNDED },
            });
          }
        }
      }

      return tx.order.update({
        where: { id: input.orderId },
        data: {
          status: nextStatus,
          statusHistory: {
            create: {
              status: nextStatus,
              notes: input.notes || `Status updated to ${nextStatus}`,
              actorId,
            },
          },
        },
        include: {
          address: true,
          items: { include: { product: true } },
          statusHistory: { orderBy: { createdAt: 'asc' } },
          payments: true,
          returns: true,
        },
      });
    });

    await this.notificationsService.createNotification(
      order.userId,
      `Order Status Update: ${nextStatus}`,
      `Your order #${order.orderNumber} status is now ${nextStatus}.`,
      nextStatus,
    );

    return updated;
  }

  async requestReturn(userId: string, input: RequestReturnInput) {
    const order = await this.prisma.order.findUnique({ where: { id: input.orderId } });
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Returns, refunds, and replacements can only be requested for delivered orders');
    }

    const type = (input.type || 'RETURN').toUpperCase();
    if (!['RETURN', 'REFUND', 'REPLACEMENT'].includes(type)) {
      throw new BadRequestException('Type must be RETURN, REFUND, or REPLACEMENT');
    }

    const existing = await this.prisma.return.findFirst({
      where: { orderId: order.id, status: { notIn: [ReturnStatus.REJECTED, ReturnStatus.COMPLETED] } },
    });
    if (existing) {
      throw new BadRequestException('An open return request already exists for this order');
    }

    const created = await this.prisma.return.create({
      data: {
        orderId: order.id,
        reason: input.reason,
        type,
        status: ReturnStatus.REQUESTED,
      },
      include: { order: { include: { address: true } } },
    });

    await this.notificationsService.createNotification(
      userId,
      'Return request submitted',
      `Your ${type.toLowerCase()} request for order #${order.orderNumber} has been received.`,
      'RETURN_REFUND',
    );

    return created;
  }

  async updateReturnStatus(actorId: string, input: UpdateReturnStatusInput) {
    const ret = await this.prisma.return.findUnique({
      where: { id: input.returnId },
      include: { order: { include: { address: true, items: true, payments: true } } },
    });
    if (!ret) {
      throw new NotFoundException('Return request not found');
    }

    const nextStatus = input.status as ReturnStatus;
    const allowed = RETURN_STATUS_TRANSITIONS[ret.status] || [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Cannot change return from ${ret.status} to ${nextStatus}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (nextStatus === ReturnStatus.COMPLETED) {
        if (ret.type === 'RETURN' || ret.type === 'REPLACEMENT') {
          for (const item of ret.order.items) {
            const inventory = await tx.inventory.findUnique({ where: { productId: item.productId } });
            if (inventory) {
              await tx.inventory.update({
                where: { id: inventory.id },
                data: { stockQuantity: { increment: item.quantity } },
              });
              await tx.inventoryTransaction.create({
                data: {
                  inventoryId: inventory.id,
                  quantityChange: item.quantity,
                  reason: InventoryAdjustmentReason.MANUAL_CORRECTION,
                  notes: `${ret.type} completed for ${ret.order.orderNumber}`,
                  actorId,
                },
              });
            }
          }
        }

        if (ret.type === 'REFUND' || ret.type === 'RETURN') {
          for (const payment of ret.order.payments) {
            if (payment.status === PaymentStatus.COMPLETED) {
              await tx.refund.create({
                data: {
                  paymentId: payment.id,
                  amount: payment.amount,
                  reason: input.notes || ret.reason,
                  status: 'COMPLETED',
                },
              });
              await tx.payment.update({
                where: { id: payment.id },
                data: { status: PaymentStatus.REFUNDED },
              });
            }
          }
        }
      }

      return tx.return.update({
        where: { id: ret.id },
        data: { status: nextStatus },
        include: { order: { include: { address: true } } },
      });
    });

    await this.notificationsService.createNotification(
      ret.order.userId,
      `Return ${nextStatus}`,
      `Your ${ret.type.toLowerCase()} request for order #${ret.order.orderNumber} is now ${nextStatus}.`,
      ret.type === 'REPLACEMENT' ? 'REPLACEMENT' : 'RETURN_REFUND',
    );

    return updated;
  }

  async getUserReturns(userId: string) {
    return this.prisma.return.findMany({
      where: { order: { userId } },
      include: { order: { include: { address: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllReturns() {
    return this.prisma.return.findMany({
      include: { order: { include: { address: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Address Management
  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
  }

  async createAddress(userId: string, input: CreateAddressInput) {
    if (input.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.create({
      data: {
        ...input,
        userId,
      },
    });
  }
}
