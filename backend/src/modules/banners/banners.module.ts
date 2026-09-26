import { Module } from '@nestjs/common';
import { BannersService } from './banners.service';
import { BannersResolver } from './banners.resolver';
import { BannersController } from './banners.controller';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ProductsModule],
  controllers: [BannersController],
  providers: [BannersService, BannersResolver],
  exports: [BannersService],
})
export class BannersModule {}
