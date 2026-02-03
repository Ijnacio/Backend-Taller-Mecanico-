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

    // 2. Base de Datos - Configuración exclusiva para PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
        username: configService.get<string>('DB_USERNAME') || 'postgres',
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE') || 'taller_mecanico',
        autoLoadEntities: true,
        // synchronize debe ser false en producción para evitar pérdida de datos
        synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
        // Opcional: Logging para ver qué consultas fallan en consola
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
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