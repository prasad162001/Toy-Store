import { Resolver, Query, Mutation, Args, ObjectType, Field, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BannersService } from './banners.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorator';

@ObjectType()
export class BannerType {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  subtitle?: string;

  @Field()
  imageUrl: string;

  @Field()
  mediaType: string;

  @Field({ nullable: true })
  ctaText?: string;

  @Field({ nullable: true })
  ctaLink?: string;

  @Field(() => Int)
  displayOrder: number;

  @Field()
  isActive: boolean;
}

@Resolver(() => BannerType)
export class BannersResolver {
  constructor(private bannersService: BannersService) {}

  @Query(() => [BannerType])
  async banners(): Promise<BannerType[]> {
    return this.bannersService.getActiveBanners();
  }

  @Query(() => [BannerType])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async adminBanners(): Promise<BannerType[]> {
    return this.bannersService.getAllBanners();
  }

  @Mutation(() => BannerType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async createBanner(
    @Args('title') title: string,
    @Args('imageUrl') imageUrl: string,
    @Args('mediaType', { nullable: true }) mediaType?: string,
    @Args('subtitle', { nullable: true }) subtitle?: string,
    @Args('ctaText', { nullable: true }) ctaText?: string,
    @Args('ctaLink', { nullable: true }) ctaLink?: string,
  ): Promise<BannerType> {
    return this.bannersService.createBanner(title, subtitle, imageUrl, ctaText, ctaLink, mediaType || 'IMAGE');
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async deleteBanner(@Args('id') id: string): Promise<boolean> {
    return this.bannersService.deleteBanner(id);
  }

  @Mutation(() => BannerType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async updateBanner(
    @Args('id') id: string,
    @Args('title', { nullable: true }) title?: string,
    @Args('subtitle', { nullable: true }) subtitle?: string,
    @Args('imageUrl', { nullable: true }) imageUrl?: string,
    @Args('mediaType', { nullable: true }) mediaType?: string,
    @Args('ctaText', { nullable: true }) ctaText?: string,
    @Args('ctaLink', { nullable: true }) ctaLink?: string,
    @Args('displayOrder', { nullable: true, type: () => Int }) displayOrder?: number,
    @Args('isActive', { nullable: true }) isActive?: boolean,
  ): Promise<BannerType> {
    return this.bannersService.updateBanner(id, { title, subtitle, imageUrl, mediaType, ctaText, ctaLink, displayOrder, isActive });
  }

  @Mutation(() => BannerType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async reorderBanner(@Args('id') id: string, @Args('displayOrder', { type: () => Int }) displayOrder: number): Promise<BannerType> {
    return this.bannersService.reorderBanner(id, displayOrder);
  }
}
