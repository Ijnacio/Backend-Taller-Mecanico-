import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. ACTIVAR CORS (Permite acceso desde Vercel, localhost, etc.)
  app.enableCors({
    origin: '*', // Permite conexión desde cualquier origen
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization',
  });

  // 2. PREFIJO GLOBAL (Tus rutas serán /api/auth, /api/products, etc.)
  app.setGlobalPrefix('api');

  // 3. VALIDACIONES (Para que funcionen los DTOs)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 4. CONFIGURACIÓN DE SWAGGER (La documentación)
  const config = new DocumentBuilder()
    .setTitle('API Taller Mecánico')
    .setDescription('Documentación de endpoints para el Taller')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // 5. INICIAR SERVIDOR (Escuchando en 0.0.0.0 para Oracle Cloud)
  await app.listen(3000, '0.0.0.0');
  
  console.log(`🚀 Server running on port 3000`);
  console.log(`📄 Swagger available at /docs`);
}
bootstrap();