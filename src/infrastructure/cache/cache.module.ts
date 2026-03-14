import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const useRedis = configService.get('USE_REDIS', 'false') === 'true';

        if (useRedis) {
          // Dynamic import to avoid requiring redis in dev
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { redisStore } = await import('cache-manager-redis-yet' as any);
          const redisUrl = configService.get('REDIS_URL');

          const storeConfig = redisUrl
            ? { url: redisUrl }
            : {
                socket: {
                  host: configService.get('REDIS_HOST', 'localhost'),
                  port: parseInt(configService.get('REDIS_PORT', '6379')),
                },
              };

          return {
            store: await redisStore(storeConfig),
            ttl: 600 * 1000, // 10 minutes
          };
        }

        return {
          ttl: 600 * 1000,
          max: 100,
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [NestCacheModule],
})
export class AppCacheModule {}
