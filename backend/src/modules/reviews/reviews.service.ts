import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(userId: string, productId: string, rating: number, title: string | undefined, comment: string) {
    // Verified purchase check (CRITICAL REQUIREMENT)
    const purchasedOrder = await this.prisma.order.findFirst({
      where: {
        userId,
        status: 'DELIVERED',
        items: {
          some: { productId },
        },
      },
    });

    if (!purchasedOrder) {
      throw new BadRequestException('Only customers who have purchased and received this product can write a review.');
    }

    const existingReview = await this.prisma.review.findFirst({
      where: { userId, productId },
    });

    if (existingReview) {
      throw new BadRequestException('You have already submitted a review for this product.');
    }

    return this.prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        title,
        comment,
        isApproved: true,
      },
      include: {
        user: true,
      },
    });
  }

  async getProductReviews(productId: string) {
    return this.prisma.review.findMany({
      where: { productId, isApproved: true },
      include: { user: true, images: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllReviews() {
    return this.prisma.review.findMany({
      include: { user: true, product: true, images: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async moderateReview(reviewId: string, isApproved: boolean) {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { isApproved },
    });
  }
}
