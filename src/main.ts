import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
