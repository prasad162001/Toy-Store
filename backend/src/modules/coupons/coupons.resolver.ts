import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CouponType, CreateCouponInput, UpdateCouponInput } from './dto/coupons.dto';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorator';

@Resolver(() => CouponType)
export class CouponsResolver {
  constructor(private couponsService: CouponsService) {}

  @Query(() => [CouponType])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async adminCoupons(): Promise<CouponType[]> {
    return this.couponsService.getAllCoupons();
  }

  @Mutation(() => CouponType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async createCoupon(@Args('input') input: CreateCouponInput): Promise<CouponType> {
    return this.couponsService.createCoupon(input);
  }

  @Mutation(() => CouponType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async updateCoupon(@Args('input') input: UpdateCouponInput): Promise<CouponType> {
    return this.couponsService.updateCoupon(input);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async deleteCoupon(@Args('id') id: string): Promise<boolean> {
    return this.couponsService.deleteCoupon(id);
  }
}
