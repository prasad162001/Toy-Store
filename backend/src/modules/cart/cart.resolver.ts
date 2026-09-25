import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { CartService } from './cart.service';
import { CartType, AddToCartInput, UpdateCartItemInput } from './dto/cart.dto';
import { CurrentUser } from '../auth/decorators/auth.decorator';

@Resolver(() => CartType)
export class CartResolver {
  constructor(private cartService: CartService) {}

  @Query(() => CartType)
  async cart(
    @Args('sessionId', { nullable: true }) sessionId?: string,
    @CurrentUser() user?: any,
  ): Promise<CartType> {
    return this.cartService.getCart(user?.id, sessionId);
  }

  @Mutation(() => CartType)
  async addToCart(
    @Args('input') input: AddToCartInput,
    @CurrentUser() user?: any,
  ): Promise<CartType> {
    return this.cartService.addToCart(input, user?.id);
  }

  @Mutation(() => CartType)
  async updateCartItem(
    @Args('input') input: UpdateCartItemInput,
    @Args('sessionId', { nullable: true }) sessionId?: string,
    @CurrentUser() user?: any,
  ): Promise<CartType> {
    return this.cartService.updateCartItem(input, user?.id, sessionId);
  }

  @Mutation(() => CartType)
  async removeCartItem(
    @Args('cartItemId') cartItemId: string,
    @Args('sessionId', { nullable: true }) sessionId?: string,
    @CurrentUser() user?: any,
  ): Promise<CartType> {
    return this.cartService.removeCartItem(cartItemId, user?.id, sessionId);
  }

  @Mutation(() => CartType)
  async syncGuestCart(
    @Args('sessionId') sessionId: string,
    @CurrentUser() user: any,
  ): Promise<CartType> {
    return this.cartService.syncGuestCart(sessionId, user.id);
  }
}
