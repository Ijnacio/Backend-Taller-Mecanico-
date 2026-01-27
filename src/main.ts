import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

<<<<<<< HEAD
  // 1. ACTIVAR CORS (Permite acceso desde cualquier lado por ahora)
  app.enableCors();

  // 2. PREFIJO GLOBAL (Tus rutas serán /api/auth, /api/products, etc.)
  app.setGlobalPrefix('api');

  // 3. VALIDACIONES (Para que funcionen los DTOs)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // Transforma los datos automáticamente
    }),
  );

  // 4. CONFIGURACIÓN DE SWAGGER (La documentación)
  const config = new DocumentBuilder()
    .setTitle('API Taller Mecánico')
    .setDescription('Documentación de endpoints para el Taller')
    .setVersion('1.0')
    .addBearerAuth() // Añade botón para meter el Token JWT
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  // La ruta será: http://IP:3000/docs
  SwaggerModule.setup('docs', app, document);

  // 5. INICIAR SERVIDOR (¡IMPORTANTE: '0.0.0.0'!)
  // Si no pones '0.0.0.0', Oracle no dejará que entres desde tu casa.
  await app.listen(3000, '0.0.0.0');
  
  console.log(`🚀 Server running on port 3000`);
  console.log(`📄 Swagger available at /docs`);
}
bootstrap();
=======
  // ESTA ES LA LÍNEA MÁGICA QUE NECESITAS
  app.setGlobalPrefix('api');

  // Habilitar CORS para que Vercel pueda entrar
  app.enableCors({
    origin: '*', // O la URL de tu frontend en Vercel
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  await app.listen(3000);
}
bootstrap();
>>>>>>> 0ea5e2679475b00ba3a21e90c12365fa727a9940
