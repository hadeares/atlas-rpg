import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { CACHE_CLIENT } from './cache.constants';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_CLIENT) private readonly client: Redis) {}

  /**
   * Retorna o valor em cache ou calcula, grava e retorna.
   * Falhas de Redis nunca impedem o cálculo — apenas deixam de cachear.
   */
  async getOrSet<T>(key: string, ttlSeconds: number, compute: () => T | Promise<T>): Promise<T> {
    try {
      const cached = await this.client.get(key);
      if (cached !== null) return JSON.parse(cached) as T;
    } catch (error) {
      this.logger.warn(`Falha ao ler cache "${key}": ${(error as Error).message}`);
    }

    const value = await compute();

    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(`Falha ao gravar cache "${key}": ${(error as Error).message}`);
    }

    return value;
  }

  async invalidate(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.warn(`Falha ao invalidar cache "${key}": ${(error as Error).message}`);
    }
  }
}
