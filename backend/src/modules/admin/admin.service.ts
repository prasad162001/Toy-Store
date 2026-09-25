import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryAdjustmentReason } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAdminMetrics() {
    const [totalProducts, totalOrders, totalUsers, revenueAggregate] = await Promise.all([
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.order.count(),
      this.prisma.user.count(),
      this.prisma.order.aggregate({
        _sum: { grandTotal: true },
        where: { status: { not: 'CANCELLED' } },
      }),
    ]);

    const recentOrders = await this.prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: true, address: true },
    });

    const lowStockProducts = await this.prisma.product.findMany({
      where: {
        inventory: {
          stockQuantity: { lte: 5 },
        },
      },
      include: { inventory: true, category: true },
    });

    return {
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue: revenueAggregate._sum.grandTotal || 0,
      recentOrders,
      lowStockProducts,
    };
  }

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      include: {
        userRoles: { include: { role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      id: u.id,
      accountName: u.accountName,
      mobile: u.mobile,
      email: u.email,
      roles: u.userRoles.map((ur) => ur.role.name),
      isVerified: u.isVerified,
      isActive: u.isActive,
      createdAt: u.createdAt,
    }));
  }

  async getAuditLogs() {
    return this.prisma.adminAuditLog.findMany({
      include: { actor: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async updateStock(actorId: string, productId: string, stockQuantity: number, reason: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { productId },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory record not found for product');
    }

    const diff = stockQuantity - inventory.stockQuantity;

    const updated = await this.prisma.inventory.update({
      where: { productId },
      data: { stockQuantity },
    });

    await this.prisma.inventoryTransaction.create({
      data: {
        inventoryId: inventory.id,
        quantityChange: diff,
        reason: InventoryAdjustmentReason.RESTOCK,
        notes: reason || 'Manual stock update by admin/staff',
        actorId,
      },
    });

    await this.prisma.adminAuditLog.create({
      data: {
        actorId,
        action: 'UPDATE_STOCK',
        entity: 'Product',
        entityId: productId,
        metadata: JSON.stringify({ oldStock: inventory.stockQuantity, newStock: stockQuantity, reason }),
      },
    });

    return updated;
  }
}
