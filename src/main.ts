import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Habilitar CORS (CORREGIDO)
  // Como usas "withCredentials: true" en el Frontend, NO puedes usar '*'
  // Debes especificar las URLs exactas.
  app.enableCors({
    origin: [
      'http://localhost:5173', // Para cuando pruebas en tu PC local
      process.env.FRONTEND_URL, // Lee la URL que pusiste en el archivo .env del servidor
      // Si no usas la variable de entorno, agrega tu URL de Vercel aquí abajo como string:
      'https://inventario-frenos-frontend.vercel.app', 
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // 👈 ESTO ES OBLIGATORIO para que Axios no falle
  });

  // 2. Prefijo Global
  // Tus rutas quedarán como: http://IP:3000/api/products
  app.setGlobalPrefix('api');

  // 3. Activación de Validaciones (DTOs)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina campos basura que no estén en el DTO
      forbidNonWhitelisted: true, // Da error si envían campos extra
      transform: true, // Convierte tipos automáticamente (ej: "id": "1" -> 1)
    }),
  );

  // 4. Configuración de Swagger (Documentación)
  const config = new DocumentBuilder()
    .setTitle('API Taller Frenos Aguilera')
    .setDescription('Documentación del Backend para gestión de Taller')
    .setVersion('1.0')
    .addBearerAuth() // Habilita el botón para probar con Token JWT
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); // Docu disponible en /docs

  // 5. Iniciar Servidor
  // Usa el puerto del entorno o el 3000 por defecto
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Servidor corriendo en: http://localhost:${port}/api`);
  console.log(`📄 Documentación Swagger: http://localhost:${port}/docs`);
}
void bootstrap();
