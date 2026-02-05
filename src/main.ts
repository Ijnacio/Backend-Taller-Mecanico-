import basicAuth = require('express-basic-auth');
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. ACTIVAR CORS
  app.enableCors({
    origin: [
      'https://sistemataller.work'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });


  // 2. PREFIJO GLOBAL
  app.setGlobalPrefix('api');

  // 3. VALIDACIONES
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // --- NUEVO: PROTECCIÓN EXCLUSIVA PARA SWAGGER ---
  // Esto pedirá usuario y pass antes de mostrar la página de docs
  app.use(
    ['/docs', '/docs-json'],
    basicAuth({
      challenge: true,
      users: {
        'admin': 'AGUILERA_PRO_2026', // <--- CAMBIA ESTA CLAVE POR LA QUE QUIERAS
      },
    }),
  );

  // 4. CONFIGURACIÓN DE SWAGGER
  const config = new DocumentBuilder()
    .setTitle('API Taller Mecánico')
    .setDescription('Documentación de endpoints para el Taller')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // 5. FILTROS Y LOGGER
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(3000, '0.0.0.0');

  const { DiscordLogger } = require('./common/services/logger-discord.service');
  DiscordLogger.sendError('✅ El servidor se ha reiniciado correctamente y está operativo.');

  console.log(`🚀 Server running on port 3000`);
  console.log(`📄 Swagger protected and available at /docs`);
}
bootstrap();