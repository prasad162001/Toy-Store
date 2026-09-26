import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ImageStorageService } from '../products/storage.service';

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService, private imageStorage: ImageStorageService) {}

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

  async createBanner(title: string, subtitle: string | undefined, imageUrl: string, ctaText: string | undefined, ctaLink: string | undefined, mediaType = 'IMAGE') {
    return this.prisma.banner.create({
      data: { title, subtitle, imageUrl, mediaType, ctaText, ctaLink, isActive: true },
    });
  }

  async deleteBanner(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (banner) await this.imageStorage.remove(banner.imageUrl);
    await this.prisma.banner.delete({ where: { id } });
    return true;
  }

  async updateBanner(id: string, data: { title?: string; subtitle?: string; imageUrl?: string; mediaType?: string; ctaText?: string; ctaLink?: string; displayOrder?: number; isActive?: boolean }) {
    return this.prisma.banner.update({ where: { id }, data });
  }

  async reorderBanner(id: string, displayOrder: number) {
    return this.updateBanner(id, { displayOrder });
  }
}
