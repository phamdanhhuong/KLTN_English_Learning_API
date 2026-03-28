import { NotFoundException } from '@nestjs/common';
import { GetUserStatsUseCase } from './get-stats.usecase';

describe('GetUserStatsUseCase', () => {
  let useCase: GetUserStatsUseCase;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      streakData: { findUnique: jest.fn() },
      userCurrency: { findUnique: jest.fn() },
      userEnergy: { findUnique: jest.fn() },
      userDailyActivity: { findMany: jest.fn() },
    };
    useCase = new GetUserStatsUseCase(prisma);
  });

  it('should return user stats', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', username: 'test', fullName: 'Test', profilePictureUrl: null,
      xpPoints: 200, currentLevel: 3, totalXpEarned: 500,
    });
    prisma.streakData.findUnique.mockResolvedValue({ currentStreak: 7, longestStreak: 14, lastStudyDate: new Date(), freezeCount: 0 });
    prisma.userCurrency.findUnique.mockResolvedValue({ gems: 50, coins: 100 });
    prisma.userEnergy.findUnique.mockResolvedValue({ currentEnergy: 3, maxEnergy: 5 });
    prisma.userDailyActivity.findMany.mockResolvedValue([]);

    const result = await useCase.execute('u1');
    expect(result.xp.xpPoints).toBe(200);
    expect(result.streak.currentStreak).toBe(7);
    expect(result.currency.gems).toBe(50);
    expect(result.energy.currentEnergy).toBe(3);
  });

  it('should throw NotFoundException when user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.streakData.findUnique.mockResolvedValue(null);
    prisma.userCurrency.findUnique.mockResolvedValue(null);
    prisma.userEnergy.findUnique.mockResolvedValue(null);
    prisma.userDailyActivity.findMany.mockResolvedValue([]);

    await expect(useCase.execute('non-existent')).rejects.toThrow(NotFoundException);
  });
});
