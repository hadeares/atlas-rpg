import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import { AppModule } from './app.module';

const PLACEHOLDER_JWT_SECRET = 'troque-esta-chave-por-uma-chave-grande';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  const jwtSecret = config.getOrThrow<string>('JWT_SECRET');
  if (nodeEnv === 'production' && (jwtSecret === PLACEHOLDER_JWT_SECRET || jwtSecret.length < 24)) {
    Logger.error('JWT_SECRET inválido para produção. Defina uma chave forte e única na variável de ambiente JWT_SECRET.', 'Bootstrap');
    process.exit(1);
  }

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
