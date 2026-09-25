import { InputType, Field, ObjectType, Int, Float } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ProductType } from '../../products/dto/products.dto';

@ObjectType()
export class CartItemType {
  @Field()
  id: string;

  @Field()
  productId: string;

  @Field(() => ProductType)
  product: ProductType;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  itemTotal: number;
}

@ObjectType()
export class CartType {
  @Field()
  id: string;

  @Field(() => [CartItemType])
  items: CartItemType[];

  @Field(() => Float)
  subtotal: number;

  @Field(() => Float)
  deliveryFee: number;

  @Field(() => Float)
  freeDeliveryThreshold: number;

  @Field(() => Float)
  grandTotal: number;

  @Field(() => Int)
  totalItems: number;
}

@InputType()
export class AddToCartInput {
  @Field()
  @IsString()
  productId: string;

  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sessionId?: string;
}

@InputType()
export class UpdateCartItemInput {
  @Field()
  cartItemId: string;

  @Field(() => Int)
  quantity: number;
}

@InputType()
export class SyncGuestCartInput {
  @Field()
  sessionId: string;
}
