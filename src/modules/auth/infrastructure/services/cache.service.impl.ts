import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheService } from '../../domain/services/cache.service';

@Injectable()
export class CacheServiceImpl implements CacheService {
  private readonly logger = new Logger(CacheServiceImpl.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      return value ?? null;
    } catch (error) {
      this.logger.warn(`Cache GET failed for key "${key}": ${error.message}`);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttlSeconds ? ttlSeconds * 1000 : undefined);
    } catch (error) {
      this.logger.warn(`Cache SET failed for key "${key}": ${error.message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.warn(`Cache DEL failed for key "${key}": ${error.message}`);
    }
  }
}
