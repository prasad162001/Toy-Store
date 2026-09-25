import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async getWishlist(userId: string) {
    let wishlist = await this.prisma.wishlist.findUnique({
      where: { userId },
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

    if (!wishlist) {
      wishlist = await this.prisma.wishlist.create({
        data: { userId },
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

    return wishlist.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      product: {
        ...item.product,
        finalPrice: Math.round(item.product.price * (1 - item.product.discountPercent / 100)),
        averageRating: 5.0,
        reviewCount: 0,
      },
    }));
  }

  async toggleWishlistItem(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let wishlist = await this.prisma.wishlist.findUnique({ where: { userId } });
    if (!wishlist) {
      wishlist = await this.prisma.wishlist.create({ data: { userId } });
    }

    const existing = await this.prisma.wishlistItem.findUnique({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
    });

    if (existing) {
      await this.prisma.wishlistItem.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.wishlistItem.create({
        data: { wishlistId: wishlist.id, productId },
      });
    }

    return this.getWishlist(userId);
  }
}
