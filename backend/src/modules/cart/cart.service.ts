import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddToCartInput, UpdateCartItemInput, CartType } from './dto/cart.dto';

const FREE_DELIVERY_THRESHOLD = 999;
const FIXED_DELIVERY_FEE = 99;

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId?: string, sessionId?: string): Promise<CartType> {
    if (!userId && !sessionId) {
      throw new BadRequestException('Either userId or sessionId must be provided');
    }

    let cart = await this.prisma.cart.findFirst({
      where: userId ? { userId } : { sessionId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                images: { orderBy: { displayOrder: 'asc' } },
                inventory: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: userId ? { userId } : { sessionId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                  images: { orderBy: { displayOrder: 'asc' } },
                  inventory: true,
                },
              },
            },
          },
        },
      });
    }

    let subtotal = 0;
    let totalItems = 0;

    const mappedItems = cart.items.map((item) => {
      const finalPrice = Math.round(item.product.price * (1 - item.product.discountPercent / 100));
      const itemTotal = finalPrice * item.quantity;
      subtotal += itemTotal;
      totalItems += item.quantity;

      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        itemTotal,
        product: {
          ...item.product,
          finalPrice,
          averageRating: 5.0,
          reviewCount: 0,
        },
      };
    });

    const deliveryFee = subtotal > 0 && subtotal < FREE_DELIVERY_THRESHOLD ? FIXED_DELIVERY_FEE : 0;
    const grandTotal = subtotal + deliveryFee;

    return {
      id: cart.id,
      items: mappedItems,
      subtotal,
      deliveryFee,
      freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
      grandTotal,
      totalItems,
    };
  }

  async addToCart(input: AddToCartInput, userId?: string): Promise<CartType> {
    const product = await this.prisma.product.findUnique({
      where: { id: input.productId },
      include: { inventory: true },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found or unavailable');
    }

    const availableStock = product.inventory?.stockQuantity || 0;
    if (availableStock < input.quantity) {
      throw new BadRequestException(`Only ${availableStock} items in stock for ${product.name}`);
    }

    let cart = await this.prisma.cart.findFirst({
      where: userId ? { userId } : { sessionId: input.sessionId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: userId ? { userId } : { sessionId: input.sessionId },
      });
    }

    const existingItem = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: input.productId } },
    });

    const newQuantity = (existingItem?.quantity || 0) + input.quantity;
    if (availableStock < newQuantity) {
      throw new BadRequestException(`Cannot add more than available stock (${availableStock})`);
    }

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: input.productId,
          quantity: input.quantity,
        },
      });
    }

    return this.getCart(userId, input.sessionId);
  }

  async updateCartItem(input: UpdateCartItemInput, userId?: string, sessionId?: string): Promise<CartType> {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: input.cartItemId },
      include: { product: { include: { inventory: true } } },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (input.quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: input.cartItemId } });
    } else {
      const stock = cartItem.product.inventory?.stockQuantity || 0;
      if (stock < input.quantity) {
        throw new BadRequestException(`Only ${stock} items available in stock`);
      }

      await this.prisma.cartItem.update({
        where: { id: input.cartItemId },
        data: { quantity: input.quantity },
      });
    }

    return this.getCart(userId, sessionId);
  }

  async removeCartItem(cartItemId: string, userId?: string, sessionId?: string): Promise<CartType> {
    await this.prisma.cartItem.delete({ where: { id: cartItemId } }).catch(() => {});
    return this.getCart(userId, sessionId);
  }

  async syncGuestCart(sessionId: string, userId: string): Promise<CartType> {
    const guestCart = await this.prisma.cart.findUnique({
      where: { sessionId },
      include: { items: true },
    });

    if (guestCart && guestCart.items.length > 0) {
      let userCart = await this.prisma.cart.findFirst({ where: { userId } });
      if (!userCart) {
        userCart = await this.prisma.cart.create({ data: { userId } });
      }

      for (const gItem of guestCart.items) {
        await this.prisma.cartItem.upsert({
          where: { cartId_productId: { cartId: userCart.id, productId: gItem.productId } },
          update: { quantity: { increment: gItem.quantity } },
          create: {
            cartId: userCart.id,
            productId: gItem.productId,
            quantity: gItem.quantity,
          },
        });
      }

      await this.prisma.cart.delete({ where: { id: guestCart.id } }).catch(() => {});
    }

    return this.getCart(userId);
  }
}
