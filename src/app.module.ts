import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ProvidersModule } from './providers/providers.module';
import { PurchasesModule } from './purchases/purchases.module';
import { CategoriesModule } from './categories/categories.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { CounterSalesModule } from './counter-sales/counter-sales.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Para usar variables de entorno luego
    TypeOrmModule.forRoot({
      type: 'sqlite',           // Tipo de BD: Archivo local
      database: 'taller.db',    // Nombre del archivo que se creará
      entities: [__dirname + '/**/*.entity{.ts,.js}'], // Busca tus tablas automáticamente
      synchronize: true,        // ¡Mágico! Crea las tablas por ti
    }), 
    ProvidersModule, 
    PurchasesModule, 
    CategoriesModule, 
    VehiclesModule,
    CounterSalesModule,
    UsersModule,
    AuthModule,
    // Aquí irán tus módulos (Products, WorkOrders, etc.)
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}