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
    @Args('subtitle', { nullable: true }) subtitle?: string,
    @Args('ctaText', { nullable: true }) ctaText?: string,
    @Args('ctaLink', { nullable: true }) ctaLink?: string,
  ): Promise<BannerType> {
    return this.bannersService.createBanner(title, subtitle, imageUrl, ctaText, ctaLink);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async deleteBanner(@Args('id') id: string): Promise<boolean> {
    return this.bannersService.deleteBanner(id);
  }
}
