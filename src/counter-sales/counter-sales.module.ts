import { Module } from '@nestjs/common';
import { CounterSalesService } from './counter-sales.service';
import { CounterSalesController } from './counter-sales.controller';

@Module({
  controllers: [CounterSalesController],
  providers: [CounterSalesService],
  exports: [CounterSalesService]
})
export class CounterSalesModule {}
