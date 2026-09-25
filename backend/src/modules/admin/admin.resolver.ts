import { Resolver, Query, Mutation, Args, ObjectType, Field, Float, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { OrderType } from '../orders/dto/orders.dto';
import { ProductType, InventoryType } from '../products/dto/products.dto';
import { UserType } from '../auth/dto/auth.dto';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../auth/decorators/auth.decorator';

@ObjectType()
export class AdminMetricsType {
  @Field(() => Int)
  totalProducts: number;

  @Field(() => Int)
  totalOrders: number;

  @Field(() => Int)
  totalUsers: number;

  @Field(() => Float)
  totalRevenue: number;

  @Field(() => [OrderType])
  recentOrders: OrderType[];

  @Field(() => [ProductType])
  lowStockProducts: ProductType[];
}

@ObjectType()
export class AuditLogType {
  @Field()
  id: string;

  @Field()
  action: string;

  @Field()
  entity: string;

  @Field({ nullable: true })
  entityId?: string;

  @Field({ nullable: true })
  metadata?: string;

  @Field()
  createdAt: Date;

  @Field(() => UserType)
  actor: UserType;
}

@Resolver()
export class AdminResolver {
  constructor(private adminService: AdminService) {}

  @Query(() => AdminMetricsType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async adminMetrics(): Promise<AdminMetricsType> {
    return this.adminService.getAdminMetrics();
  }

  @Query(() => [UserType])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async adminUsers(): Promise<UserType[]> {
    return this.adminService.getAllUsers();
  }

  @Query(() => [AuditLogType])
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async adminAuditLogs(): Promise<AuditLogType[]> {
    return this.adminService.getAuditLogs();
  }

  @Mutation(() => InventoryType)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  async updateStock(
    @CurrentUser() user: any,
    @Args('productId') productId: string,
    @Args('stockQuantity', { type: () => Int }) stockQuantity: number,
    @Args('reason', { nullable: true }) reason?: string,
  ): Promise<InventoryType> {
    return this.adminService.updateStock(user.id, productId, stockQuantity, reason || 'Stock adjustment');
  }
}
