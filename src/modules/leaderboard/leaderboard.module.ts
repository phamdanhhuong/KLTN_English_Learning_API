import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';
import { FeedModule } from '../feed/feed.module';

// Domain
import { LEADERBOARD_TOKENS } from './domain/di/tokens';

// Application
import { LeaderboardService } from './application/services/leaderboard.service';
import { LeagueScheduler } from './application/schedulers/league.scheduler';

// Infrastructure
import { PrismaLeagueRepository } from './infrastructure/repositories/prisma-league.repository';
import { PrismaParticipantRepository } from './infrastructure/repositories/prisma-participant.repository';
import { PrismaUserTierRepository } from './infrastructure/repositories/prisma-user-tier.repository';
import { PrismaLeagueHistoryRepository } from './infrastructure/repositories/prisma-league-history.repository';

// Presentation
import { LeaderboardController } from './presentation/leaderboard.controller';

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
  controllers: [LeaderboardController],
  providers: [
    // Repository bindings
    {
      provide: LEADERBOARD_TOKENS.LEAGUE_REPOSITORY,
      useClass: PrismaLeagueRepository,
    },
    {
      provide: LEADERBOARD_TOKENS.PARTICIPANT_REPOSITORY,
      useClass: PrismaParticipantRepository,
    },
    {
      provide: LEADERBOARD_TOKENS.USER_TIER_REPOSITORY,
      useClass: PrismaUserTierRepository,
    },
    {
      provide: LEADERBOARD_TOKENS.LEAGUE_HISTORY_REPOSITORY,
      useClass: PrismaLeagueHistoryRepository,
    },
    // Services
    LeaderboardService,
    LeagueScheduler,
  ],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
