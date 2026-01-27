import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// TUS MÓDULOS
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { ClientsModule } from './clients/clients.module';
import { ProvidersModule } from './providers/providers.module';
import { PurchasesModule } from './purchases/purchases.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { VehicleModelsModule } from './vehicle-models/vehicle-models.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';
import { CounterSalesModule } from './counter-sales/counter-sales.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    // 1. Configuración Global (.env)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Base de Datos - Lee del .env (SQLite o PostgreSQL)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<string>('DB_TYPE') || 'sqlite';

        // Configuración base común
        const baseConfig = {
          autoLoadEntities: true,
          synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
        };

        // SQLite (desarrollo/tests)
        if (dbType === 'sqlite') {
          return {
            ...baseConfig,
            type: 'sqlite' as const,
            database: configService.get<string>('DB_DATABASE') || './taller.db',
          };
        }

        // PostgreSQL (producción)
        return {
          ...baseConfig,
          type: 'postgres' as const,
          host: configService.get<string>('DB_HOST') || 'localhost',
          port: parseInt(configService.get<string>('DB_PORT') || '5432'),
          username: configService.get<string>('DB_USERNAME') || 'postgres',
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE') || 'taller_mecanico',
        };
      },
      inject: [ConfigService],
    }),

    // 3. TUS MÓDULOS DEL SISTEMA
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    ClientsModule,
    ProvidersModule,
    PurchasesModule,
    VehiclesModule,
    VehicleModelsModule,
    WorkOrdersModule,
    CounterSalesModule,
    ReportsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}