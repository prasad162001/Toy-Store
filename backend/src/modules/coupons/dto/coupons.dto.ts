import { InputType, Field, ObjectType, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class CouponType {
  @Field()
  id: string;

  @Field()
  code: string;

  @Field()
  discountType: string;

  @Field(() => Float)
  discountVal: number;

  @Field(() => Float)
  minOrderVal: number;

  @Field(() => Float, { nullable: true })
  maxDiscount?: number;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  expiresAt?: Date;

  @Field(() => Int, { nullable: true })
  usageLimit?: number;

  @Field(() => Int, { nullable: true })
  perUserLimit?: number;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;
}

@InputType()
export class CreateCouponInput {
  @Field()
  code: string;

  @Field({ defaultValue: 'PERCENTAGE' })
  discountType?: string;

  @Field(() => Float)
  discountVal: number;

  @Field(() => Float, { defaultValue: 0 })
  minOrderVal?: number;

  @Field(() => Float, { nullable: true })
  maxDiscount?: number;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  expiresAt?: Date;

  @Field(() => Int, { nullable: true })
  usageLimit?: number;

  @Field(() => Int, { defaultValue: 1 })
  perUserLimit?: number;

  @Field({ defaultValue: true })
  isActive?: boolean;
}

@InputType()
export class UpdateCouponInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  code?: string;

  @Field({ nullable: true })
  discountType?: string;

  @Field(() => Float, { nullable: true })
  discountVal?: number;

  @Field(() => Float, { nullable: true })
  minOrderVal?: number;

  @Field(() => Float, { nullable: true })
  maxDiscount?: number;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  expiresAt?: Date;

  @Field(() => Int, { nullable: true })
  usageLimit?: number;

  @Field(() => Int, { nullable: true })
  perUserLimit?: number;

  @Field({ nullable: true })
  isActive?: boolean;
}
