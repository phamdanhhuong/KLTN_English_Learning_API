import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';

import { LeaderboardService } from './application/services/leaderboard.service';
import { LeagueScheduler } from './application/schedulers/league.scheduler';

import { LeaderboardController } from './presentation/leaderboard.controller';

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
  controllers: [LeaderboardController],
  providers: [
    LeaderboardService,
    LeagueScheduler,
  ],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
