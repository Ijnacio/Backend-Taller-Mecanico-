import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Habilitar CORS
  app.enableCors({
    origin: [
      'http://localhost:5173', // Tu PC local
      'https://inventario-frenos-frontend.vercel.app', // Tu Vercel (¡Sin barra al final!)
      process.env.FRONTEND_URL, // La variable del .env (si la usas)
    ].filter(Boolean), // Esto elimina valores "undefined" para evitar errores
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 2. Prefijo Global
  app.setGlobalPrefix('api');

  // 3. Validaciones
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 4. Swagger
  const config = new DocumentBuilder()
    .setTitle('API Taller Frenos Aguilera')
    .setDescription('Documentación del Backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // 5. Iniciar Servidor (MODO DOCKER)
  const port = process.env.PORT || 3000;
  
  // IMPORTANTE: '0.0.0.0' permite conexiones desde fuera del contenedor
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Servidor corriendo en puerto: ${port}`);
}
void bootstrap();
