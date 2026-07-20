import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('DB_HOST'),
        port: Number(config.getOrThrow<string>('DB_PORT')),
        username: config.getOrThrow<string>('DB_USER'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        // rejectUnauthorized false cobre provedores com certificado próprio
        // (Supabase) e os com CA pública (Neon) sem configuração extra.
        ssl: config.get<string>('DB_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
        migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
        migrationsRun: config.get<string>('DB_RUN_MIGRATIONS', 'false') === 'true',
        logging: config.get<string>('DB_LOGGING', 'false') === 'true'
      })
    })
  ]
})
export class DatabaseModule {}
