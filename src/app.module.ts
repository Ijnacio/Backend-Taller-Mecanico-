// En src/app.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'; // Necesario para leer variables de entorno
// ... tus otros imports

@Module({
  imports: [
    // 1. Configurar el lector de variables de entorno (.env)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Configurar la Base de Datos Dinámica
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        // ¿Existe la variable DATABASE_URL? (La que pusimos en docker-compose)
        const isProduction = !!process.env.DATABASE_URL;

        if (isProduction) {
          // CONFIGURACIÓN PARA ORACLE CLOUD (PRODUCCIÓN) 🚀
          return {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            autoLoadEntities: true,
            synchronize: true, // En un proyecto final real, esto idealmente sería false y usarías migraciones, pero para la entrega está bien true.
            ssl: false, // En Docker interno no necesitamos SSL
          };
        } else {
          // CONFIGURACIÓN PARA TU PC (LOCAL) 🏠
          return {
            type: 'sqlite',
            database: 'taller.db',
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
          };
        }
      },
    }),

    // ... el resto de tus módulos (AuthModule, ProductsModule, etc.)
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
