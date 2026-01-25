import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Habilitar CORS (Para que el Frontend de Fran pueda conectarse)
  app.enableCors({
    origin: '*', // Por ahora déjalo en asterisco para facilitar las pruebas
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  // 2. Prefijo Global (Tus rutas ahora serán /api/products, /api/auth, etc.)
  app.setGlobalPrefix('api');

  // 3. Activación de Validaciones (DTOs)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina campos que no estén en el DTO (Seguridad)
      forbidNonWhitelisted: true, // Tira error si mandan basura extra
      transform: true, // Convierte "10" (string) a 10 (number) automáticamente
    }),
  );

  // 4. Configuración de Swagger (Documentación)
  const config = new DocumentBuilder()
    .setTitle('API Taller Frenos Aguilera')
    .setDescription('Documentación del Backend para gestión de Taller')
    .setVersion('1.0')
    .addBearerAuth() // Botón para meter el Token
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); // Docu en /docs

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Servidor corriendo en: http://localhost:3000/api`);
  console.log(`📄 Documentación Swagger: http://localhost:3000/docs`);
}
void bootstrap();
