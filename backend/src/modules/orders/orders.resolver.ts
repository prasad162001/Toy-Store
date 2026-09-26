import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  OrderType,
  CreateOrderInput,
  UpdateOrderStatusInput,
  AddressType,
  CreateAddressInput,
  CouponValidationResponse,
  ReturnType,
  RequestReturnInput,
  UpdateReturnStatusInput,
  UpdateOrderInput,
} from './dto/orders.dto';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../auth/decorators/auth.decorator';

@Resolver(() => OrderType)
export class OrdersResolver {
  constructor(private ordersService: OrdersService) {}

  @Query(() => CouponValidationResponse)
  async validateCoupon(
    @Args('code') code: string,
    @Args('subtotal') subtotal: number,
  ): Promise<CouponValidationResponse> {
    return this.ordersService.validateCoupon(code, subtotal);
  }

  @Mutation(() => OrderType)
  @UseGuards(GqlAuthGuard)
  async createOrder(
    @CurrentUser() user: any,
    @Args('input') input: CreateOrderInput,
  ): Promise<OrderType> {
    return this.ordersService.createOrder(user.id, input);
  }

  @Query(() => [OrderType])
  @UseGuards(GqlAuthGuard)
  async myOrders(@CurrentUser() user: any): Promise<OrderType[]> {
    return this.ordersService.getUserOrders(user.id);
  }

  @Query(() => OrderType)
  @UseGuards(GqlAuthGuard)
  async order(
    @Args('id') id: string,
    @CurrentUser() user: any,
  ): Promise<OrderType> {
    return this.ordersService.getOrderById(id, user.id, user.roles || []);
  }

  @Query(() => [OrderType])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  async adminOrders(): Promise<OrderType[]> {
    return this.ordersService.getAllOrders();
  }

  @Mutation(() => OrderType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  async updateOrderStatus(
    @CurrentUser() user: any,
    @Args('input') input: UpdateOrderStatusInput,
  ): Promise<OrderType> {
    return this.ordersService.updateOrderStatus(user.id, input, user.roles || []);
  }

  @Mutation(() => OrderType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async updateOrder(@CurrentUser() user: any, @Args('input') input: UpdateOrderInput): Promise<OrderType> {
    return this.ordersService.updateOrder(user.id, input, user.roles || []);
  }

  @Query(() => [AddressType])
  @UseGuards(GqlAuthGuard)
  async myAddresses(@CurrentUser() user: any): Promise<AddressType[]> {
    return this.ordersService.getAddresses(user.id);
  }

  @Mutation(() => AddressType)
  @UseGuards(GqlAuthGuard)
  async createAddress(
    @CurrentUser() user: any,
    @Args('input') input: CreateAddressInput,
  ): Promise<AddressType> {
    return this.ordersService.createAddress(user.id, input);
  }

  @Mutation(() => ReturnType)
  @UseGuards(GqlAuthGuard)
  async requestReturn(
    @CurrentUser() user: any,
    @Args('input') input: RequestReturnInput,
  ): Promise<ReturnType> {
    return this.ordersService.requestReturn(user.id, input);
  }

  @Query(() => [ReturnType])
  @UseGuards(GqlAuthGuard)
  async myReturns(@CurrentUser() user: any): Promise<ReturnType[]> {
    return this.ordersService.getUserReturns(user.id);
  }

  @Query(() => [ReturnType])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  async adminReturns(): Promise<ReturnType[]> {
    return this.ordersService.getAllReturns();
  }

  @Mutation(() => ReturnType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  async updateReturnStatus(
    @CurrentUser() user: any,
    @Args('input') input: UpdateReturnStatusInput,
  ): Promise<ReturnType> {
    return this.ordersService.updateReturnStatus(user.id, input);
  }
}
