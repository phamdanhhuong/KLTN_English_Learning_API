import { Injectable, Inject } from '@nestjs/common';
import { UserMiniGameRepository } from '../../domain/repositories/user-mini-game.repository.interface';
import { SubmitMiniGameDto } from '../dto/submit-mini-game.dto';
import { StarCalculationFactory } from '../strategies/star-calculation.strategy';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class SubmitMiniGameScoreUseCase {
  constructor(
    @Inject('UserMiniGameRepository')
    private readonly repository: UserMiniGameRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, dto: SubmitMiniGameDto) {
    const { partId, gameType, score, timeSpentMs, mistakesCount } = dto;

    // 1. Tính sao dựa vào Strategy
    const strategy = StarCalculationFactory.getStrategy(gameType);
    const { stars: newStars } = strategy.calculateStars(score, timeSpentMs, mistakesCount);

    // 2. Lấy record hiện tại
    const currentRecord = await this.repository.findByUserAndPart(userId, partId, gameType);
    const currentStars = currentRecord?.stars || 0;
    const currentBestScore = currentRecord?.bestScore || 0;
    const currentPlayCount = currentRecord?.playCount || 0;

    // 3. So sánh để thưởng xu
    let rewardedCoins = 0;
    if (newStars > currentStars) {
      // Mỗi sao kiếm thêm được thưởng 10 xu
      const starDifference = newStars - currentStars;
      rewardedCoins = starDifference * 10;
      
      if (rewardedCoins > 0) {
        await this.prisma.userCurrency.upsert({
          where: { userId },
          update: { coins: { increment: rewardedCoins } },
          create: { userId, coins: 100 + rewardedCoins, gems: 0 },
        });
      }
    }

    // 4. Update DB
    const isNewHighScore = score > currentBestScore;
    const finalStars = Math.max(newStars, currentStars);
    const finalBestScore = Math.max(score, currentBestScore);
    
    let finalBestTime = currentRecord?.bestTimeMs || null;
    if (finalBestTime === null || timeSpentMs < finalBestTime) {
      finalBestTime = timeSpentMs;
    }

    const updatedRecord = await this.repository.upsertRecord({
      userId,
      partId,
      gameType,
      bestScore: finalBestScore,
      stars: finalStars,
      playCount: currentPlayCount + 1,
      bestTimeMs: finalBestTime,
    });

    return {
      success: true,
      newStars,
      totalStars: finalStars,
      isNewHighScore,
      rewardedCoins,
      record: updatedRecord,
    };
  }
}
