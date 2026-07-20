import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(compression({ threshold: 1024 }));
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: config.get<string>('WEB_ORIGIN', 'http://localhost:3000'),
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  const port = Number(config.get<string>('PORT', '3333'));
  await app.listen(port);
}

void bootstrap();
