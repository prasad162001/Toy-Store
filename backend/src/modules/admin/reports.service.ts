import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryReportInput, InventoryReport, SalesReportInput, SalesReport } from './reports.dto';

const saleStatuses = [
  OrderStatus.ORDER_PLACED,
  OrderStatus.CONFIRMED,
  OrderStatus.PACKED,
  OrderStatus.SHIPPED,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async salesReport(input: SalesReportInput = {}) : Promise<SalesReport> {
    const start = input.startDate ? new Date(`${input.startDate}T00:00:00.000Z`) : undefined;
    const end = input.endDate ? new Date(`${input.endDate}T00:00:00.000Z`) : undefined;
    if (start && end && start > end) throw new BadRequestException('Start date must be before end date');
    const endExclusive = end ? new Date(end.getTime() + 24 * 60 * 60 * 1000) : undefined;
    const category = input.category || 'all';
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: saleStatuses },
        createdAt: { ...(start ? { gte: start } : {}), ...(endExclusive ? { lt: endExclusive } : {}) },
        payments: { some: { status: PaymentStatus.COMPLETED } },
        ...(category !== 'all' ? { items: { some: { product: { category: { slug: category } } } } } : {}),
      },
      include: {
        items: { include: { product: { include: { category: true } } } },
        payments: { include: { refunds: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = [];
    let grossSales = 0;
    let discounts = 0;
    let shipping = 0;
    let refunds = 0;
    let totalItemsSold = 0;
    const orderIds = new Set<string>();

    for (const order of orders) {
      const saleItems = order.items.filter((item) => category === 'all' || item.product.category.slug === category);
      const saleSubtotal = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
      if (!saleSubtotal) continue;
      orderIds.add(order.id);
      shipping += order.deliveryFee * (saleSubtotal / (order.subtotal || saleSubtotal));
      discounts += order.discount * (saleSubtotal / (order.subtotal || saleSubtotal));
      for (const payment of order.payments.filter((payment) => payment.status === PaymentStatus.COMPLETED)) {
        refunds += payment.refunds.filter((refund) => refund.status === 'COMPLETED').reduce((sum, refund) => sum + refund.amount, 0);
      }
      for (const item of saleItems) {
        grossSales += item.totalPrice;
        totalItemsSold += item.quantity;
        rows.push({
          orderId: order.orderNumber,
          orderDate: order.createdAt,
          productName: item.productName,
          category: item.product.category.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: order.discount * (item.totalPrice / (order.subtotal || saleSubtotal)),
          lineTotal: item.totalPrice,
          orderTotal: order.grandTotal,
          paymentStatus: PaymentStatus.COMPLETED,
          orderStatus: order.status,
        });
      }
    }

    return {
      title: 'Toy Store Sales Report',
      category: category === 'all' ? 'All Toys' : `${category[0].toUpperCase()}${category.slice(1)} Toys`,
      dateRange: `${input.startDate || 'All time'} - ${input.endDate || 'Present'}`,
      summary: { totalOrders: orderIds.size, totalItemsSold, grossSales, discounts, shipping, refunds, netRevenue: grossSales - discounts + shipping - refunds },
      rows,
    };
  }

  async inventoryReport(input: InventoryReportInput = {}): Promise<InventoryReport> {
    const category = input.category || 'all';
    const products = await this.prisma.product.findMany({
      where: { isActive: true, ...(category !== 'all' ? { category: { slug: category } } : {}) },
      include: { category: true, inventory: true, orderItems: { where: { order: { status: { in: saleStatuses } } } } },
      orderBy: { name: 'asc' },
    });
    const rows = products.map((product) => {
      const currentStock = product.inventory?.stockQuantity || 0;
      const lowStockThreshold = product.inventory?.lowStockThreshold || 5;
      const stockStatus = currentStock === 0 ? 'OUT_OF_STOCK' : currentStock <= lowStockThreshold ? 'LOW_STOCK' : 'IN_STOCK';
      const unitsSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
      return { productId: product.id, productName: product.name, category: product.category.name, currentStock, unitsSold, stockStatus, price: product.price, inventoryValue: currentStock * product.price };
    }).filter((row) => !input.stockStatus || input.stockStatus === 'all' || row.stockStatus.toLowerCase() === input.stockStatus);

    return {
      title: 'Toy Store Inventory Report',
      category: category === 'all' ? 'All Toys' : `${category[0].toUpperCase()}${category.slice(1)} Toys`,
      summary: {
        totalProducts: rows.length,
        inStock: rows.filter((row) => row.stockStatus === 'IN_STOCK').length,
        lowStock: rows.filter((row) => row.stockStatus === 'LOW_STOCK').length,
        outOfStock: rows.filter((row) => row.stockStatus === 'OUT_OF_STOCK').length,
        inventoryValue: rows.reduce((sum, row) => sum + row.inventoryValue, 0),
      },
      rows,
    };
  }
}
