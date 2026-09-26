import { InputType, Field, ObjectType, Int, Float } from '@nestjs/graphql';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

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
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  ageRange?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  inStockOnly?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isNewArrival?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isBestSeller?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sortBy?: string; // 'price_asc', 'price_desc', 'newest', 'rating', 'popular'

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 12 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

@InputType()
export class CreateProductInput {
  @Field()
  @IsString()
  name: string;

  @Field()
  @IsString()
  description: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  specifications?: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  price: number;

  @Field(() => Float, { defaultValue: 0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @Field()
  @IsString()
  recommendedAge: string;

  @Field()
  @IsString()
  categoryId: string;

  @Field(() => Int, { defaultValue: 10 })
  @IsInt()
  @Min(0)
  initialStock?: number;

  @Field(() => [String])
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @Field({ defaultValue: false })
  @IsBoolean()
  isFeatured?: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  isNewArrival?: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  isBestSeller?: boolean;
}

@InputType()
export class UpdateProductInput {
  @Field()
  @IsString()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  specifications?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  recommendedAge?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isNewArrival?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isBestSeller?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
