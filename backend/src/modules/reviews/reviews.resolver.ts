import { Resolver, Query, Mutation, Args, ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { UserType } from '../auth/dto/auth.dto';
import { ProductType } from '../products/dto/products.dto';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../auth/decorators/auth.decorator';

@ObjectType()
export class ReviewType {
  @Field()
  id: string;

  @Field()
  productId: string;

  @Field(() => Int)
  rating: number;

  @Field({ nullable: true })
  title?: string;

  @Field()
  comment: string;

  @Field()
  isApproved: boolean;

  @Field()
  createdAt: Date;

  @Field(() => UserType, { nullable: true })
  user?: UserType;

  @Field(() => ProductType, { nullable: true })
  product?: ProductType;
}

@InputType()
export class CreateReviewInput {
  @Field()
  productId: string;

  @Field(() => Int)
  rating: number;

  @Field({ nullable: true })
  title?: string;

  @Field()
  comment: string;
}

@Resolver(() => ReviewType)
export class ReviewsResolver {
  constructor(private reviewsService: ReviewsService) {}

  @Query(() => [ReviewType])
  async productReviews(@Args('productId') productId: string): Promise<ReviewType[]> {
    return this.reviewsService.getProductReviews(productId);
  }

  @Mutation(() => ReviewType)
  @UseGuards(GqlAuthGuard)
  async createReview(
    @CurrentUser() user: any,
    @Args('input') input: CreateReviewInput,
  ): Promise<ReviewType> {
    return this.reviewsService.createReview(user.id, input.productId, input.rating, input.title, input.comment);
  }

  @Query(() => [ReviewType])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async adminReviews(): Promise<ReviewType[]> {
    return this.reviewsService.getAllReviews();
  }

  @Mutation(() => ReviewType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async moderateReview(
    @Args('reviewId') reviewId: string,
    @Args('isApproved') isApproved: boolean,
  ): Promise<ReviewType> {
    return this.reviewsService.moderateReview(reviewId, isApproved);
  }
}
