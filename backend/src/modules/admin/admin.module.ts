import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminResolver } from './admin.resolver';
import { ReportsResolver } from './reports.resolver';
import { ReportsService } from './reports.service';

@Module({
  providers: [AdminService, AdminResolver, ReportsResolver, ReportsService],
  exports: [AdminService],
})
export class AdminModule {}
