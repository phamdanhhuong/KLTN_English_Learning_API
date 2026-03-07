import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { AddXpUseCase } from './xp/add-xp.usecase';
import { UpdateStreakUseCase } from './streak/update-streak.usecase';

export interface LessonCompletedDto {
  userId: string;
  lessonId: string;
  lessonType: string;
  xpEarned: number;
  gemsEarned?: number;
  coinsEarned?: number;
}

export interface LessonCompletionSummary {
  xp: { added: number; newTotal: number; newLevel: number; leveledUp: boolean };
  streak: { currentStreak: number; previousStreak: number; streakBroken: boolean; milestoneReached: number | null };
  currency: { gemsEarned: number; coinsEarned: number };
}

@Injectable()
export class LessonCompletedUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly addXpUseCase: AddXpUseCase,
    private readonly updateStreakUseCase: UpdateStreakUseCase,
  ) {}

  async execute(dto: LessonCompletedDto): Promise<LessonCompletionSummary> {
    // Chạy XP và Streak song song (mỗi cái đã có transaction riêng)
    const [xpResult, streakResult] = await Promise.all([
      this.addXpUseCase.execute(dto.userId, dto.xpEarned, 'lesson'),
      this.updateStreakUseCase.execute(dto.userId),
    ]);

    // Thêm currency bonus từ bài học (nếu có)
    let totalGemsEarned = xpResult.gemsEarned + (dto.gemsEarned ?? 0);
    let totalCoinsEarned = dto.coinsEarned ?? 0;

    if ((dto.gemsEarned ?? 0) > 0 || (dto.coinsEarned ?? 0) > 0) {
      await this.prisma.$transaction(async (tx) => {
        await tx.userCurrency.update({
          where: { userId: dto.userId },
          data: {
            ...(dto.gemsEarned ? { gems: { increment: dto.gemsEarned } } : {}),
            ...(dto.coinsEarned ? { coins: { increment: dto.coinsEarned } } : {}),
          },
        });
        if (dto.gemsEarned) {
          await tx.currencyTransaction.create({
            data: { userId: dto.userId, currencyType: 'GEMS', amount: dto.gemsEarned,
              reason: 'LESSON_COMPLETED', metadata: { lessonId: dto.lessonId, lessonType: dto.lessonType } },
          });
        }
        if (dto.coinsEarned) {
          await tx.currencyTransaction.create({
            data: { userId: dto.userId, currencyType: 'COINS', amount: dto.coinsEarned,
              reason: 'LESSON_COMPLETED', metadata: { lessonId: dto.lessonId, lessonType: dto.lessonType } },
          });
        }
      });
    }

    // Cộng thêm gems từ streak milestone vào tổng
    totalGemsEarned += streakResult.gemsEarned;
    totalCoinsEarned += streakResult.coinsEarned;

    return {
      xp: {
        added: dto.xpEarned,
        newTotal: xpResult.newXp,
        newLevel: xpResult.newLevel,
        leveledUp: xpResult.leveledUp,
      },
      streak: {
        currentStreak: streakResult.currentStreak,
        previousStreak: streakResult.previousStreak,
        streakBroken: streakResult.streakBroken,
        milestoneReached: streakResult.milestoneReached,
      },
      currency: { gemsEarned: totalGemsEarned, coinsEarned: totalCoinsEarned },
    };
  }
}
