import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleModelsService } from './vehicle-models.service';
import { VehicleModelsController } from './vehicle-models.controller';
import { VehicleModel } from './entities/vehicle-model.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleModel])],
  controllers: [VehicleModelsController],
  providers: [VehicleModelsService],
  exports: [VehicleModelsService, TypeOrmModule],
})
export class VehicleModelsModule {}
