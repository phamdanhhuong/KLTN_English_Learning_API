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
    const redisUrl = this.configService.get('REDIS_URL');

    if (redisUrl) {
      this.client = createClient({ url: redisUrl });
    } else {
      const host = this.configService.get('REDIS_HOST', 'localhost');
      const port = parseInt(this.configService.get('REDIS_PORT', '6379'));
      const password = this.configService.get('REDIS_PASSWORD');

      this.client = createClient({
        socket: { host, port },
        ...(password ? { password } : {}),
      });
    }

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

  // ─── Sorted Set operations (Leaderboard) ────────────────

  /** ZINCRBY — thêm/cộng score cho member. Trả về score mới. */
  async zIncrBy(
    key: string,
    increment: number,
    member: string,
  ): Promise<number> {
    if (!this.isConnected) return 0;
    try {
      return await this.client.zIncrBy(key, increment, member);
    } catch {
      return 0;
    }
  }

  /** ZREVRANGE WITHSCORES — top N members desc by score */
  async zRevRangeWithScores(
    key: string,
    start: number,
    stop: number,
  ): Promise<{ value: string; score: number }[]> {
    if (!this.isConnected) return [];
    try {
      return await this.client.zRangeWithScores(key, start, stop, {
        REV: true,
      });
    } catch {
      return [];
    }
  }

  /** ZREVRANK — rank của member (0-based, desc). Null nếu không có. */
  async zRevRank(key: string, member: string): Promise<number | null> {
    if (!this.isConnected) return null;
    try {
      return await this.client.zRevRank(key, member);
    } catch {
      return null;
    }
  }

  /** ZSCORE — score hiện tại của member */
  async zScore(key: string, member: string): Promise<number | null> {
    if (!this.isConnected) return null;
    try {
      return await this.client.zScore(key, member);
    } catch {
      return null;
    }
  }

  /** ZCARD — tổng số members trong sorted set */
  async zCard(key: string): Promise<number> {
    if (!this.isConnected) return 0;
    try {
      return await this.client.zCard(key);
    } catch {
      return 0;
    }
  }

  /** ZADD — thêm member với score (dùng khi backfill từ DB) */
  async zAdd(key: string, score: number, member: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.zAdd(key, { score, value: member });
    } catch {
      // Silently fail
    }
  }

  /** EXPIRE — set TTL cho key */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.expire(key, ttlSeconds);
    } catch {
      // Silently fail
    }
  }

  /** KEYS — tìm keys theo pattern (chỉ dùng cho admin/cleanup, không production hot path) */
  async keys(pattern: string): Promise<string[]> {
    if (!this.isConnected) return [];
    try {
      return await this.client.keys(pattern);
    } catch {
      return [];
    }
  }

  /** Xóa nhiều keys theo pattern */
  async delPattern(pattern: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      const matchingKeys = await this.client.keys(pattern);
      if (matchingKeys.length > 0) {
        await this.client.del(matchingKeys);
      }
    } catch {
      // Silently fail
    }
  }
}
