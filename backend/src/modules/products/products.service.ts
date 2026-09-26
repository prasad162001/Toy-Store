import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductFilterInput, CreateProductInput, UpdateProductInput, PaginatedProductsResponse } from './dto/products.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async getProductForAdmin(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async getProducts(filter?: ProductFilterInput): Promise<PaginatedProductsResponse> {
    const page = filter?.page || 1;
    const limit = filter?.limit || 12;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (filter?.categorySlug) {
      where.category = { slug: filter.categorySlug.toLowerCase() };
    }

    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
        { category: { name: { contains: filter.search, mode: 'insensitive' } } },
      ];
    }

    if (filter?.minPrice !== undefined || filter?.maxPrice !== undefined) {
      where.price = {};
      if (filter.minPrice !== undefined) where.price.gte = filter.minPrice;
      if (filter.maxPrice !== undefined) where.price.lte = filter.maxPrice;
    }

    if (filter?.ageRange) {
      where.recommendedAge = { contains: filter.ageRange, mode: 'insensitive' };
    }

    if (filter?.inStockOnly) {
      where.inventory = { stockQuantity: { gt: 0 } };
    }

    if (filter?.isFeatured !== undefined) where.isFeatured = filter.isFeatured;
    if (filter?.isNewArrival !== undefined) where.isNewArrival = filter.isNewArrival;
    if (filter?.isBestSeller !== undefined) where.isBestSeller = filter.isBestSeller;

    let orderBy: any = { createdAt: 'desc' };
    if (filter?.sortBy === 'price_asc') orderBy = { price: 'asc' };
    if (filter?.sortBy === 'price_desc') orderBy = { price: 'desc' };
    if (filter?.sortBy === 'popular') orderBy = { isBestSeller: 'desc' };

    const [products, totalCount] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          images: { orderBy: { displayOrder: 'asc' } },
          inventory: true,
          reviews: { where: { isApproved: true }, select: { rating: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const mapped = products.map((p) => {
      const finalPrice = Math.round(p.price * (1 - p.discountPercent / 100));
      const ratingSum = p.reviews.reduce((acc, r) => acc + r.rating, 0);
      const averageRating = p.reviews.length > 0 ? Number((ratingSum / p.reviews.length).toFixed(1)) : 5.0;

      return {
        ...p,
        finalPrice,
        averageRating,
        reviewCount: p.reviews.length,
      };
    });

    return {
      products: mapped,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
    };
  }

  async getProductBySlug(slug: string) {
    const p = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: { orderBy: { displayOrder: 'asc' } },
        inventory: true,
        reviews: {
          where: { isApproved: true },
          include: { user: true, images: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!p) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    const finalPrice = Math.round(p.price * (1 - p.discountPercent / 100));
    const ratingSum = p.reviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = p.reviews.length > 0 ? Number((ratingSum / p.reviews.length).toFixed(1)) : 5.0;

    return {
      ...p,
      finalPrice,
      averageRating,
      reviewCount: p.reviews.length,
    };
  }

  async createProduct(input: CreateProductInput) {
    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const p = await this.prisma.product.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        specifications: input.specifications,
        price: input.price,
        discountPercent: input.discountPercent || 0,
        recommendedAge: input.recommendedAge,
        categoryId: input.categoryId,
        isFeatured: input.isFeatured || false,
        isNewArrival: input.isNewArrival || false,
        isBestSeller: input.isBestSeller || false,
        images: {
          create: (input.imageUrls || []).map((url, idx) => ({
            url,
            isPrimary: idx === 0,
            displayOrder: idx,
          })),
        },
        inventory: {
          create: {
            stockQuantity: input.initialStock || 10,
            lowStockThreshold: 5,
          },
        },
      },
      include: {
        category: true,
        images: true,
        inventory: true,
      },
    });

    return {
      ...p,
      finalPrice: Math.round(p.price * (1 - p.discountPercent / 100)),
      averageRating: 5.0,
      reviewCount: 0,
    };
  }

  async updateProduct(input: UpdateProductInput) {
    const { id, ...data } = input;
    const p = await this.prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        images: true,
        inventory: true,
      },
    });

    return {
      ...p,
      finalPrice: Math.round(p.price * (1 - p.discountPercent / 100)),
      averageRating: 5.0,
      reviewCount: 0,
    };
  }

  async deleteProduct(id: string) {
    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
    return true;
  }

  // PRODUCT IMAGE MANAGEMENT
  async addProductImage(productId: string, url: string, isPrimary = false, displayOrder = 0) {
    if (isPrimary) {
      await this.prisma.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.productImage.create({
      data: {
        productId,
        url,
        isPrimary,
        displayOrder,
      },
    });
  }

  async updateProductImage(imageId: string, isPrimary?: boolean, displayOrder?: number) {
    const img = await this.prisma.productImage.findUnique({ where: { id: imageId } });
    if (!img) {
      throw new NotFoundException('Product image not found');
    }

    if (isPrimary) {
      await this.prisma.productImage.updateMany({
        where: { productId: img.productId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.productImage.update({
      where: { id: imageId },
      data: {
        isPrimary: isPrimary !== undefined ? isPrimary : img.isPrimary,
        displayOrder: displayOrder !== undefined ? displayOrder : img.displayOrder,
      },
    });
  }

  async deleteProductImage(imageId: string) {
    await this.prisma.productImage.delete({ where: { id: imageId } });
    return true;
  }
}
