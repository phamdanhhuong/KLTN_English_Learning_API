import { MiniGameType } from '@prisma/client';

export interface StarCalculationResult {
  stars: number;
}

export abstract class StarCalculationStrategy {
  abstract calculateStars(score: number, timeSpentMs: number, mistakesCount: number): StarCalculationResult;
}

export class ArcadeStarStrategy extends StarCalculationStrategy {
  calculateStars(score: number, timeSpentMs: number, mistakesCount: number): StarCalculationResult {
    // Thời gian dưới 2 phút (120,000 ms) = 3 sao
    // Dưới 3 phút (180,000 ms) = 2 sao
    // Hoàn thành = 1 sao
    if (timeSpentMs <= 120000) return { stars: 3 };
    if (timeSpentMs <= 180000) return { stars: 2 };
    return { stars: 1 };
  }
}

export class PuzzleStarStrategy extends StarCalculationStrategy {
  calculateStars(score: number, timeSpentMs: number, mistakesCount: number): StarCalculationResult {
    // 0 lỗi = 3 sao
    // 1-2 lỗi = 2 sao
    // Hơn 2 lỗi = 1 sao
    if (mistakesCount === 0) return { stars: 3 };
    if (mistakesCount <= 2) return { stars: 2 };
    return { stars: 1 };
  }
}

export class DefaultStarStrategy extends StarCalculationStrategy {
  calculateStars(score: number, timeSpentMs: number, mistakesCount: number): StarCalculationResult {
    // Mặc định dựa vào score giả lập. Tối đa score 100
    if (score >= 90) return { stars: 3 };
    if (score >= 60) return { stars: 2 };
    return { stars: 1 };
  }
}

export class StarCalculationFactory {
  static getStrategy(type: MiniGameType): StarCalculationStrategy {
    switch (type) {
      case MiniGameType.ARCADE:
        return new ArcadeStarStrategy();
      case MiniGameType.PUZZLE:
        return new PuzzleStarStrategy();
      default:
        return new DefaultStarStrategy();
    }
  }
}
