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
import { ReportsModule } from './reports/reports.module';
import { ProductsModule } from './products/products.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';
import { ClientsModule } from './clients/clients.module';

@Module({
  imports: [
    // ========== CONFIGURACIÓN ==========
    ConfigModule.forRoot({ isGlobal: true }),
    
    // ========== BASE DE DATOS ==========
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'taller.db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    
    // ========== AUTENTICACIÓN ==========
    UsersModule,
    AuthModule,
    
    // ========== CATÁLOGOS BASE ==========
    CategoriesModule,
    ProvidersModule,
    VehiclesModule,
    ClientsModule,
    
    // ========== INVENTARIO ==========
    ProductsModule,
    PurchasesModule,
    
    // ========== OPERACIONES ==========
    WorkOrdersModule,
    CounterSalesModule,
    
    // ========== REPORTES ==========
    ReportsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}