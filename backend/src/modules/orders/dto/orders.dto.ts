import { InputType, Field, ObjectType, Int, Float } from '@nestjs/graphql';
import { ProductType } from '../../products/dto/products.dto';
import { OrderStatus, PaymentMethod, PaymentStatus, ReturnStatus } from '@prisma/client';

@ObjectType()
export class AddressType {
  @Field()
  id: string;

  @Field()
  fullName: string;

  @Field()
  mobile: string;

  @Field()
  street: string;

  @Field()
  city: string;

  @Field()
  state: string;

  @Field()
  pincode: string;

  @Field()
  isDefault: boolean;
}

@InputType()
export class CreateAddressInput {
  @Field()
  fullName: string;

  @Field()
  mobile: string;

  @Field()
  street: string;

  @Field()
  city: string;

  @Field()
  state: string;

  @Field()
  pincode: string;

  @Field({ defaultValue: false })
  isDefault?: boolean;
}

@InputType()
export class UpdateAddressInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  fullName?: string;

  @Field({ nullable: true })
  mobile?: string;

  @Field({ nullable: true })
  street?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  pincode?: string;

  @Field({ nullable: true })
  isDefault?: boolean;
}

@ObjectType()
export class OrderItemType {
  @Field()
  id: string;

  @Field()
  productId: string;

  @Field()
  productName: string;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  totalPrice: number;

  @Field(() => ProductType, { nullable: true })
  product?: ProductType;
}

@ObjectType()
export class OrderStatusHistoryType {
  @Field()
  id: string;

  @Field()
  status: string;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class PaymentType {
  @Field()
  id: string;

  @Field()
  transactionId: string;

  @Field()
  method: string;

  @Field()
  status: string;

  @Field(() => Float)
  amount: number;
}

@ObjectType()
export class OrderType {
  @Field()
  id: string;

  @Field()
  orderNumber: string;

  @Field()
  userId: string;

  @Field(() => AddressType)
  address: AddressType;

  @Field(() => Float)
  subtotal: number;

  @Field(() => Float)
  discount: number;

  @Field(() => Float)
  deliveryFee: number;

  @Field(() => Float)
  grandTotal: number;

  @Field({ nullable: true })
  couponCode?: string;

  @Field()
  status: string;

  @Field()
  createdAt: Date;

  @Field(() => [OrderItemType], { nullable: true })
  items?: OrderItemType[];

  @Field(() => [OrderStatusHistoryType], { nullable: true })
  statusHistory?: OrderStatusHistoryType[];

  @Field(() => [PaymentType], { nullable: true })
  payments?: PaymentType[];

  @Field(() => [ReturnType], { nullable: true })
  returns?: ReturnType[];
}

@InputType()
export class CreateOrderInput {
  @Field()
  addressId: string;

  @Field()
  paymentMethod: string; // UPI, CARD, NET_BANKING, WALLET, COD

  @Field({ nullable: true })
  couponCode?: string;

  @Field({ nullable: true })
  sessionId?: string;
}

@InputType()
export class UpdateOrderStatusInput {
  @Field()
  orderId: string;

  @Field()
  status: string; // CONFIRMED, PACKED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED

  @Field({ nullable: true })
  notes?: string;
}

@ObjectType()
export class CouponValidationResponse {
  @Field()
  isValid: boolean;

  @Field()
  message: string;

  @Field(() => Float, { nullable: true })
  discountAmount?: number;
}

@ObjectType()
export class ReturnType {
  @Field()
  id: string;

  @Field()
  orderId: string;

  @Field()
  reason: string;

  @Field()
  type: string; // RETURN, REFUND, REPLACEMENT

  @Field()
  status: string; // REQUESTED, APPROVED, REJECTED, PICKED_UP, COMPLETED

  @Field()
  createdAt: Date;

  @Field(() => OrderType, { nullable: true })
  order?: OrderType;
}

@InputType()
export class RequestReturnInput {
  @Field()
  orderId: string;

  @Field()
  reason: string;

  @Field({ defaultValue: 'RETURN' })
  type?: string; // RETURN, REFUND, REPLACEMENT
}

@InputType()
export class UpdateReturnStatusInput {
  @Field()
  returnId: string;

  @Field()
  status: string; // APPROVED, REJECTED, PICKED_UP, COMPLETED

  @Field({ nullable: true })
  notes?: string;
}
