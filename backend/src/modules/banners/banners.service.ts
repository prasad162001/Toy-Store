import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  async getActiveBanners() {
    return this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getAllBanners() {
    return this.prisma.banner.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  async createBanner(title: string, subtitle: string | undefined, imageUrl: string, ctaText: string | undefined, ctaLink: string | undefined) {
    return this.prisma.banner.create({
      data: { title, subtitle, imageUrl, ctaText, ctaLink, isActive: true },
    });
  }

  async deleteBanner(id: string) {
    await this.prisma.banner.delete({ where: { id } });
    return true;
  }
}
