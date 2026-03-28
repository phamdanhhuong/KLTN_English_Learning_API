import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';

// Domain
import { FEED_TOKENS } from './domain/di/tokens';

// Application
import { FeedService } from './application/services/feed.service';

// Infrastructure
import { PrismaFeedRepository } from './infrastructure/repositories/prisma-feed.repository';

// Presentation
import { FeedController } from './presentation/feed.controller';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRATION', '1h') as any },
      }),
    }),
  ],
  controllers: [FeedController],
  providers: [
    // Repository binding
    {
      provide: FEED_TOKENS.FEED_REPOSITORY,
      useClass: PrismaFeedRepository,
    },
    // Service
    FeedService,
  ],
  exports: [FeedService],
})
export class FeedModule {}
