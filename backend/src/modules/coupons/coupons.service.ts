import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCouponInput, UpdateCouponInput } from './dto/coupons.dto';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async getAllCoupons() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCoupon(input: CreateCouponInput) {
    const existing = await this.prisma.coupon.findUnique({
      where: { code: input.code.toUpperCase() },
    });

    if (existing) {
      throw new BadRequestException(`Coupon code "${input.code}" already exists`);
    }

    return this.prisma.coupon.create({
      data: {
        code: input.code.toUpperCase(),
        discountType: input.discountType || 'PERCENTAGE',
        discountVal: input.discountVal,
        minOrderVal: input.minOrderVal || 0,
        maxDiscount: input.maxDiscount,
        startDate: input.startDate ? new Date(input.startDate) : new Date(),
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        usageLimit: input.usageLimit,
        perUserLimit: input.perUserLimit || 1,
        isActive: input.isActive ?? true,
      },
    });
  }

  async updateCoupon(input: UpdateCouponInput) {
    const { id, ...data } = input;
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Coupon not found');
    }

    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...data,
        code: data.code ? data.code.toUpperCase() : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });
  }

  async deleteCoupon(id: string) {
    await this.prisma.coupon.delete({ where: { id } });
    return true;
  }
}
