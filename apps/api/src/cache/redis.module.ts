import { Global, Inject, Logger, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CACHE_CLIENT } from './cache.constants';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: CACHE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logger = new Logger('RedisClient');
        const client = new Redis(config.get<string>('REDIS_URL', 'redis://127.0.0.1:6379'), {
          maxRetriesPerRequest: 2,
          retryStrategy: (times) => Math.min(times * 200, 2000)
        });
        client.on('error', (error) => logger.warn(`Conexão com o Redis falhou: ${error.message}`));
        return client;
      }
    },
    CacheService
  ],
  exports: [CacheService]
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(CACHE_CLIENT) private readonly client: Redis) {}

  onModuleDestroy() {
    this.client.disconnect();
  }
}
