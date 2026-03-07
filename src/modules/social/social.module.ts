import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';

import { FollowUserUseCase } from './application/use-cases/follow-user.usecase';
import { UnfollowUserUseCase } from './application/use-cases/unfollow-user.usecase';
import { GetFollowingUseCase, GetFollowersUseCase } from './application/use-cases/get-follow-lists.usecase';
import { GetSuggestedFriendsUseCase } from './application/use-cases/get-suggested-friends.usecase';

import { SocialController } from './presentation/social.controller';

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
  controllers: [SocialController],
  providers: [
    FollowUserUseCase,
    UnfollowUserUseCase,
    GetFollowingUseCase,
    GetFollowersUseCase,
    GetSuggestedFriendsUseCase,
  ],
  exports: [
    FollowUserUseCase,
  ],
})
export class SocialModule {}
