import { Args, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorator';
import { InventoryReport, InventoryReportInput, SalesReport, SalesReportInput } from './reports.dto';
import { ReportsService } from './reports.service';

@Resolver()
export class ReportsResolver {
  constructor(private reportsService: ReportsService) {}

  @Query(() => SalesReport)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  salesReport(@Args('filters', { nullable: true }) filters?: SalesReportInput) {
    return this.reportsService.salesReport(filters || {});
  }

  @Query(() => InventoryReport)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  inventoryReport(@Args('filters', { nullable: true }) filters?: InventoryReportInput) {
    return this.reportsService.inventoryReport(filters || {});
  }
}
