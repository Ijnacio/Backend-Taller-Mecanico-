import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { Purchase } from './entities/purchase.entity';
import { PurchaseDetail } from './entities/purchase-detail.entity';
import { Product } from '../products/entities/product.entity';
import { Provider } from '../providers/entities/provider.entity';
import { Category } from '../categories/entities/category.entity';
import { VehicleModel } from '../vehicle-models/entities/vehicle-model.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Purchase, PurchaseDetail, Product, Provider, Category, VehicleModel])],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
