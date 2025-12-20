import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors({ origin: '*', credentials: true });
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3203;
  await app.listen(port);

  console.log(`Order Microservice running on port ${port}`);
}

bootstrap();

