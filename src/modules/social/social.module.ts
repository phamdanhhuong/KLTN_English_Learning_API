import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';
import { FeedModule } from '../feed/feed.module';

// Domain
import { SOCIAL_TOKENS } from './domain/di/tokens';

// Application
import { FollowUserUseCase } from './application/use-cases/follow-user.usecase';
import { UnfollowUserUseCase } from './application/use-cases/unfollow-user.usecase';
import { GetFollowingUseCase, GetFollowersUseCase } from './application/use-cases/get-follow-lists.usecase';
import { GetSuggestedFriendsUseCase } from './application/use-cases/get-suggested-friends.usecase';
import { SearchUsersUseCase } from './application/use-cases/search-users.usecase';

// Infrastructure
import { PrismaSocialRepository } from './infrastructure/repositories/prisma-social.repository';

// Presentation
import { SocialController } from './presentation/social.controller';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    FeedModule,
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
  controllers: [SocialController],
  providers: [
    // Repository binding
    {
      provide: SOCIAL_TOKENS.SOCIAL_REPOSITORY,
      useClass: PrismaSocialRepository,
    },
    // Use Cases
    FollowUserUseCase,
    UnfollowUserUseCase,
    GetFollowingUseCase,
    GetFollowersUseCase,
    GetSuggestedFriendsUseCase,
    SearchUsersUseCase,
  ],
  exports: [
    FollowUserUseCase,
    UnfollowUserUseCase,
    GetFollowingUseCase,
    GetFollowersUseCase,
  ],
})
export class SocialModule {}
