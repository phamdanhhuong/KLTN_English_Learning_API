import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';

import { AchievementCheckerService } from './application/services/achievement-checker.service';
import { GetUserAchievementsUseCase, GetAchievementsSummaryUseCase } from './application/use-cases/get-achievements.usecase';

import { AchievementController } from './presentation/achievement.controller';

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
  controllers: [AchievementController],
  providers: [
    AchievementCheckerService,
    GetUserAchievementsUseCase,
    GetAchievementsSummaryUseCase,
  ],
  exports: [
    AchievementCheckerService,
  ],
})
export class AchievementModule {}
