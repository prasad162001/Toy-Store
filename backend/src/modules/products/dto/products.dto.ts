import { InputType, Field, ObjectType, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class CategoryType {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  imageUrl?: string;
}

@ObjectType()
export class ProductImageType {
  @Field()
  id: string;

  @Field()
  url: string;

  @Field()
  isPrimary: boolean;

  @Field()
  displayOrder: number;
}

@ObjectType()
export class InventoryType {
  @Field()
  id: string;

  @Field()
  stockQuantity: number;

  @Field()
  lowStockThreshold: number;
}

@ObjectType()
export class ProductType {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field()
  description: string;

  @Field({ nullable: true })
  specifications?: string;

  @Field(() => Float)
  price: number;

  @Field(() => Float)
  discountPercent: number;

  @Field(() => Float, { nullable: true })
  finalPrice?: number;

  @Field()
  recommendedAge: string;

  @Field()
  isFeatured: boolean;

  @Field()
  isNewArrival: boolean;

  @Field()
  isBestSeller: boolean;

  @Field()
  isActive: boolean;

  @Field()
  categoryId: string;

  @Field(() => CategoryType, { nullable: true })
  category?: CategoryType;

  @Field(() => [ProductImageType], { nullable: true })
  images?: ProductImageType[];

  @Field(() => InventoryType, { nullable: true })
  inventory?: InventoryType;

  @Field(() => Float, { nullable: true })
  averageRating?: number;

  @Field(() => Int, { nullable: true })
  reviewCount?: number;
}

@ObjectType()
export class PaginatedProductsResponse {
  @Field(() => [ProductType])
  products: ProductType[];

  @Field(() => Int)
  totalCount: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  totalPages: number;
}

@InputType()
export class ProductFilterInput {
  @Field({ nullable: true })
  categorySlug?: string;

  @Field({ nullable: true })
  search?: string;

  @Field(() => Float, { nullable: true })
  minPrice?: number;

  @Field(() => Float, { nullable: true })
  maxPrice?: number;

  @Field({ nullable: true })
  ageRange?: string;

  @Field({ nullable: true })
  inStockOnly?: boolean;

  @Field({ nullable: true })
  isFeatured?: boolean;

  @Field({ nullable: true })
  isNewArrival?: boolean;

  @Field({ nullable: true })
  isBestSeller?: boolean;

  @Field({ nullable: true })
  sortBy?: string; // 'price_asc', 'price_desc', 'newest', 'rating', 'popular'

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 12 })
  limit?: number;
}

@InputType()
export class CreateProductInput {
  @Field()
  name: string;

  @Field()
  description: string;

  @Field({ nullable: true })
  specifications?: string;

  @Field(() => Float)
  price: number;

  @Field(() => Float, { defaultValue: 0 })
  discountPercent?: number;

  @Field()
  recommendedAge: string;

  @Field()
  categoryId: string;

  @Field(() => Int, { defaultValue: 10 })
  initialStock?: number;

  @Field(() => [String])
  imageUrls: string[];

  @Field({ defaultValue: false })
  isFeatured?: boolean;

  @Field({ defaultValue: false })
  isNewArrival?: boolean;

  @Field({ defaultValue: false })
  isBestSeller?: boolean;
}

@InputType()
export class UpdateProductInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  specifications?: string;

  @Field(() => Float, { nullable: true })
  price?: number;

  @Field(() => Float, { nullable: true })
  discountPercent?: number;

  @Field({ nullable: true })
  recommendedAge?: string;

  @Field({ nullable: true })
  categoryId?: string;

  @Field({ nullable: true })
  isFeatured?: boolean;

  @Field({ nullable: true })
  isNewArrival?: boolean;

  @Field({ nullable: true })
  isBestSeller?: boolean;

  @Field({ nullable: true })
  isActive?: boolean;
}
