import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePromotionInput, UpdatePromotionInput } from './dto/promotions.dto';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async getActivePromotions() {
    const now = new Date();
    return this.prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async getAllPromotions() {
    return this.prisma.promotion.findMany({
      orderBy: { startDate: 'desc' },
    });
  }

  async createPromotion(input: CreatePromotionInput) {
    return this.prisma.promotion.create({
      data: {
        title: input.title,
        description: input.description,
        bannerUrl: input.bannerUrl,
        promoType: input.promoType || 'GENERAL',
        targetId: input.targetId,
        discountVal: input.discountVal,
        minOrderVal: input.minOrderVal || 0,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        isActive: true,
      },
    });
  }

  async updatePromotion(input: UpdatePromotionInput) {
    const { id, ...data } = input;
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Promotion not found');
    }

    return this.prisma.promotion.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  async deletePromotion(id: string) {
    await this.prisma.promotion.delete({ where: { id } });
    return true;
  }
}
