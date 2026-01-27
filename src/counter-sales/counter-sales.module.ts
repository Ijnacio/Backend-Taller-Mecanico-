import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CounterSalesService } from './counter-sales.service';
import { CounterSalesController } from './counter-sales.controller';
import { CounterSale } from './entities/counter-sale.entity';
import { CounterSaleDetail } from './entities/counter-sale-detail.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CounterSale, CounterSaleDetail, Product])],
  controllers: [CounterSalesController],
  providers: [CounterSalesService],
  exports: [CounterSalesService],
})
export class CounterSalesModule {}
