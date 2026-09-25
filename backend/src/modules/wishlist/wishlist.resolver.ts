import { Resolver, Query, Mutation, Args, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { ProductType } from '../products/dto/products.dto';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/auth.decorator';

@ObjectType()
export class WishlistItemType {
  @Field()
  id: string;

  @Field()
  productId: string;

  @Field(() => ProductType)
  product: ProductType;
}

@Resolver(() => WishlistItemType)
export class WishlistResolver {
  constructor(private wishlistService: WishlistService) {}

  @Query(() => [WishlistItemType])
  @UseGuards(GqlAuthGuard)
  async myWishlist(@CurrentUser() user: any): Promise<WishlistItemType[]> {
    return this.wishlistService.getWishlist(user.id);
  }

  @Mutation(() => [WishlistItemType])
  @UseGuards(GqlAuthGuard)
  async toggleWishlistItem(
    @CurrentUser() user: any,
    @Args('productId') productId: string,
  ): Promise<WishlistItemType[]> {
    return this.wishlistService.toggleWishlistItem(user.id, productId);
  }
}
