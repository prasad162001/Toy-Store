import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

const categoryValues = ['all', 'boys', 'girls', 'unisex'];

@InputType()
export class SalesReportInput {
  @Field({ defaultValue: 'all' })
  @IsOptional()
  @IsIn(categoryValues)
  category?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate?: string;
}

@InputType()
export class InventoryReportInput {
  @Field({ defaultValue: 'all' })
  @IsOptional()
  @IsIn(categoryValues)
  category?: string;

  @Field({ defaultValue: 'all' })
  @IsOptional()
  @IsIn(['all', 'in_stock', 'low_stock', 'out_of_stock'])
  stockStatus?: string;
}

@ObjectType()
export class SalesReportSummary {
  @Field(() => Int) totalOrders: number;
  @Field(() => Int) totalItemsSold: number;
  @Field(() => Float) grossSales: number;
  @Field(() => Float) discounts: number;
  @Field(() => Float) shipping: number;
  @Field(() => Float) refunds: number;
  @Field(() => Float) netRevenue: number;
}

@ObjectType()
export class SalesReportRow {
  @Field() orderId: string;
  @Field() orderDate: Date;
  @Field() productName: string;
  @Field() category: string;
  @Field(() => Int) quantity: number;
  @Field(() => Float) unitPrice: number;
  @Field(() => Float) discount: number;
  @Field(() => Float) lineTotal: number;
  @Field(() => Float) orderTotal: number;
  @Field() paymentStatus: string;
  @Field() orderStatus: string;
}

@ObjectType()
export class SalesReport {
  @Field() title: string;
  @Field() category: string;
  @Field() dateRange: string;
  @Field(() => SalesReportSummary) summary: SalesReportSummary;
  @Field(() => [SalesReportRow]) rows: SalesReportRow[];
}

@ObjectType()
export class InventoryReportSummary {
  @Field(() => Int) totalProducts: number;
  @Field(() => Int) inStock: number;
  @Field(() => Int) lowStock: number;
  @Field(() => Int) outOfStock: number;
  @Field(() => Float) inventoryValue: number;
}

@ObjectType()
export class InventoryReportRow {
  @Field() productId: string;
  @Field() productName: string;
  @Field() category: string;
  @Field(() => Int) currentStock: number;
  @Field(() => Int) unitsSold: number;
  @Field() stockStatus: string;
  @Field(() => Float) price: number;
  @Field(() => Float) inventoryValue: number;
}

@ObjectType()
export class InventoryReport {
  @Field() title: string;
  @Field() category: string;
  @Field(() => InventoryReportSummary) summary: InventoryReportSummary;
  @Field(() => [InventoryReportRow]) rows: InventoryReportRow[];
}
