import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';
import { FeedModule } from '../feed/feed.module';

// Domain
import { ACHIEVEMENT_TOKENS } from './domain/di/tokens';

// Application
import { AchievementCheckerService } from './application/services/achievement-checker.service';
import { GetUserAchievementsUseCase, GetAchievementsSummaryUseCase } from './application/use-cases/get-achievements.usecase';

// Infrastructure
import { PrismaAchievementRepository } from './infrastructure/repositories/prisma-achievement.repository';

// Presentation
import { AchievementController } from './presentation/achievement.controller';

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
  controllers: [AchievementController],
  providers: [
    // Repository binding
    {
      provide: ACHIEVEMENT_TOKENS.ACHIEVEMENT_REPOSITORY,
      useClass: PrismaAchievementRepository,
    },
    // Services & Use Cases
    AchievementCheckerService,
    GetUserAchievementsUseCase,
    GetAchievementsSummaryUseCase,
  ],
  exports: [
    AchievementCheckerService,
  ],
})
export class AchievementModule {}
