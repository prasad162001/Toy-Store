import { InputType, Field, ObjectType, Float } from '@nestjs/graphql';

@ObjectType()
export class PromotionType {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field({ nullable: true })
  bannerUrl?: string;

  @Field()
  promoType: string; // PRODUCT, CATEGORY, MIN_ORDER, FIRST_ORDER

  @Field({ nullable: true })
  targetId?: string;

  @Field(() => Float)
  discountVal: number;

  @Field(() => Float)
  minOrderVal: number;

  @Field()
  isActive: boolean;

  @Field()
  startDate: Date;

  @Field()
  endDate: Date;
}

@InputType()
export class CreatePromotionInput {
  @Field()
  title: string;

  @Field()
  description: string;

  @Field({ nullable: true })
  bannerUrl?: string;

  @Field({ defaultValue: 'GENERAL' })
  promoType?: string;

  @Field({ nullable: true })
  targetId?: string;

  @Field(() => Float)
  discountVal: number;

  @Field(() => Float, { defaultValue: 0 })
  minOrderVal?: number;

  @Field()
  startDate: Date;

  @Field()
  endDate: Date;
}

@InputType()
export class UpdatePromotionInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  bannerUrl?: string;

  @Field({ nullable: true })
  promoType?: string;

  @Field({ nullable: true })
  targetId?: string;

  @Field(() => Float, { nullable: true })
  discountVal?: number;

  @Field(() => Float, { nullable: true })
  minOrderVal?: number;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  endDate?: Date;
}
