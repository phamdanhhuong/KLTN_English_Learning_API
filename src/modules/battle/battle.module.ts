import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';
import { FeedModule } from '../feed/feed.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';

// Domain
import { BATTLE_TOKENS } from './domain/di/tokens';

// Application
import { BattleGameService } from './application/services/battle-game.service';
import { BattleMatchmakingService } from './application/services/battle-matchmaking.service';

// Infrastructure
import { PrismaBattleRepository } from './infrastructure/repositories/prisma-battle.repository';
import { BattleGateway } from './infrastructure/gateways/battle.gateway';

// Presentation
import { BattleController } from './presentation/battle.controller';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    FeedModule,
    LeaderboardModule,
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
  controllers: [BattleController],
  providers: [
    // Repository
    {
      provide: BATTLE_TOKENS.BATTLE_REPOSITORY,
      useClass: PrismaBattleRepository,
    },
    // Services
    BattleGameService,
    BattleMatchmakingService,
    // Gateway (WebSocket)
    BattleGateway,
  ],
  exports: [BattleGameService],
})
export class BattleModule {}
