import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { PromotionType, CreatePromotionInput, UpdatePromotionInput } from './dto/promotions.dto';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorator';

@Resolver(() => PromotionType)
export class PromotionsResolver {
  constructor(private promotionsService: PromotionsService) {}

  @Query(() => [PromotionType])
  async promotions(): Promise<PromotionType[]> {
    return this.promotionsService.getActivePromotions();
  }

  @Query(() => [PromotionType])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async adminPromotions(): Promise<PromotionType[]> {
    return this.promotionsService.getAllPromotions();
  }

  @Mutation(() => PromotionType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async createPromotion(
    @Args('input') input: CreatePromotionInput,
  ): Promise<PromotionType> {
    return this.promotionsService.createPromotion(input);
  }

  @Mutation(() => PromotionType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async updatePromotion(
    @Args('input') input: UpdatePromotionInput,
  ): Promise<PromotionType> {
    return this.promotionsService.updatePromotion(input);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async deletePromotion(@Args('id') id: string): Promise<boolean> {
    return this.promotionsService.deletePromotion(id);
  }
}
