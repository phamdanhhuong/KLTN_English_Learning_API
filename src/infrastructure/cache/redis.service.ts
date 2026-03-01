import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private readonly logger = new Logger(RedisService.name);
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get('REDIS_HOST', 'localhost');
    const port = parseInt(this.configService.get('REDIS_PORT', '6379'));

    this.client = createClient({
      socket: { host, port },
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      this.logger.log('Redis Client Connected');
      this.isConnected = true;
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
    } catch (error) {
      this.logger.warn('Redis connection failed, caching disabled', error);
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected) return;
    try {
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch {
      // Silently fail - caching is non-critical
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.del(key);
    } catch {
      // Silently fail
    }
  }
}
