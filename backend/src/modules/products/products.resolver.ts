import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductType, ProductImageType, ProductFilterInput, CreateProductInput, UpdateProductInput, PaginatedProductsResponse } from './dto/products.dto';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorator';

@Resolver(() => ProductType)
export class ProductsResolver {
  constructor(private productsService: ProductsService) {}

  @Query(() => PaginatedProductsResponse)
  async products(
    @Args('filter', { nullable: true }) filter?: ProductFilterInput,
  ): Promise<PaginatedProductsResponse> {
    return this.productsService.getProducts(filter);
  }

  @Query(() => ProductType)
  async product(@Args('slug') slug: string): Promise<ProductType> {
    return this.productsService.getProductBySlug(slug);
  }

  @Mutation(() => ProductType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async createProduct(@Args('input') input: CreateProductInput): Promise<ProductType> {
    return this.productsService.createProduct(input);
  }

  @Mutation(() => ProductType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async updateProduct(@Args('input') input: UpdateProductInput): Promise<ProductType> {
    return this.productsService.updateProduct(input);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async deleteProduct(@Args('id') id: string): Promise<boolean> {
    return this.productsService.deleteProduct(id);
  }

  @Mutation(() => ProductImageType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async addProductImage(
    @Args('productId') productId: string,
    @Args('url') url: string,
    @Args('isPrimary', { nullable: true }) isPrimary?: boolean,
    @Args('displayOrder', { nullable: true }) displayOrder?: number,
  ): Promise<ProductImageType> {
    return this.productsService.addProductImage(productId, url, isPrimary, displayOrder);
  }

  @Mutation(() => ProductImageType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async updateProductImage(
    @Args('imageId') imageId: string,
    @Args('isPrimary', { nullable: true }) isPrimary?: boolean,
    @Args('displayOrder', { nullable: true }) displayOrder?: number,
  ): Promise<ProductImageType> {
    return this.productsService.updateProductImage(imageId, isPrimary, displayOrder);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async deleteProductImage(@Args('imageId') imageId: string): Promise<boolean> {
    return this.productsService.deleteProductImage(imageId);
  }
}
