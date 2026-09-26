import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsResolver } from './products.resolver';
import { ProductsController } from './products.controller';
import { ImageStorageService } from './storage.service';
import { ProductAdminGuard } from './product-admin.guard';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ProductsResolver, ImageStorageService, ProductAdminGuard],
  exports: [ProductsService, ImageStorageService],
})
export class ProductsModule {}
