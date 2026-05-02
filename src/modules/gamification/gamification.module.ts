import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { AchievementModule } from '../achievement/achievement.module';
import { FeedModule } from '../feed/feed.module';
import { QuestModule } from '../quest/quest.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';

// Streak Use Cases
import { AddXpUseCase } from './application/use-cases/xp/add-xp.usecase';
import { UpdateStreakUseCase } from './application/use-cases/streak/update-streak.usecase';
import { UseStreakFreezeUseCase } from './application/use-cases/streak/use-streak-freeze.usecase';
import { GetStreakStatusUseCase } from './application/use-cases/streak/get-streak-status.usecase';
import { GetStreakCalendarUseCase } from './application/use-cases/streak/get-streak-calendar.usecase';
import { GetStreakHistoryUseCase } from './application/use-cases/streak/get-streak-history.usecase';

// Currency Use Cases
import { SpendCurrencyUseCase } from './application/use-cases/currency/spend-currency.usecase';
import { AddCurrencyUseCase } from './application/use-cases/currency/add-currency.usecase';
import { GetCurrencyBalanceUseCase } from './application/use-cases/currency/get-currency-balance.usecase';

// Payment Use Cases
import { CreatePaymentUseCase } from './application/use-cases/currency/create-payment.usecase';
import { VnpayIpnUseCase } from './application/use-cases/currency/vnpay-ipn.usecase';
import { VnpayReturnUseCase } from './application/use-cases/currency/vnpay-return.usecase';

// Payment Service
import { VnpayService } from './application/services/vnpay.service';

// Energy Use Cases
import {
  ConsumeEnergyUseCase,
  GetEnergyUseCase,
} from './application/use-cases/energy/energy.usecase';
import { BuyEnergyUseCase } from './application/use-cases/energy/buy-energy.usecase';
import { AwardEnergyUseCase } from './application/use-cases/energy/award-energy.usecase';

// Lesson Integration
import { LessonCompletedUseCase } from './application/use-cases/lesson-completed.usecase';

// Scheduler
import { StreakScheduler } from './application/schedulers/streak.scheduler';

// Presentation
import { GamificationController } from './presentation/gamification.controller';
import { PaymentController } from './presentation/payment.controller';

@Module({
  imports: [
    PrismaModule,
    AchievementModule,
    FeedModule,
    QuestModule,
    LeaderboardModule,
    ConfigModule,
    ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRATION', '1h') as any,
        },
      }),
    }),
  ],
  controllers: [GamificationController, PaymentController],
  providers: [
    // XP
    AddXpUseCase,
    // Streak
    UpdateStreakUseCase,
    UseStreakFreezeUseCase,
    GetStreakStatusUseCase,
    GetStreakCalendarUseCase,
    GetStreakHistoryUseCase,
    // Currency
    SpendCurrencyUseCase,
    AddCurrencyUseCase,
    GetCurrencyBalanceUseCase,
    // Payment
    VnpayService,
    CreatePaymentUseCase,
    VnpayIpnUseCase,
    VnpayReturnUseCase,
    // Energy
    ConsumeEnergyUseCase,
    GetEnergyUseCase,
    BuyEnergyUseCase,
    AwardEnergyUseCase,
    // Lesson
    LessonCompletedUseCase,
    // Scheduler
    StreakScheduler,
  ],
  exports: [
    AddXpUseCase,
    UpdateStreakUseCase,
    SpendCurrencyUseCase,
    AddCurrencyUseCase,
    ConsumeEnergyUseCase,
    GetEnergyUseCase,
    AwardEnergyUseCase,
    LessonCompletedUseCase,
  ],
})
export class GamificationModule {}
