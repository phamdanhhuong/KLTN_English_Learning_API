import { GetXpHistoryUseCase } from './get-xp-history.usecase';

describe('GetXpHistoryUseCase', () => {
  let useCase: GetXpHistoryUseCase;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      userDailyActivity: { findMany: jest.fn() },
    };
    useCase = new GetXpHistoryUseCase(prisma);
  });

  it('should return XP history with zero-filled days', async () => {
    prisma.userDailyActivity.findMany.mockResolvedValue([]);

    const result = await useCase.execute('user-1', 7);
    expect(result).toHaveLength(7);
    expect(result[0].xpEarned).toBe(0);
    expect(result[0].lessonsCount).toBe(0);
  });

  it('should include actual activity data', async () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    prisma.userDailyActivity.findMany.mockResolvedValue([
      { activityDate: today, xpEarned: 50, lessonsCount: 3 },
    ]);

    const result = await useCase.execute('user-1', 7);
    expect(result).toHaveLength(7);
    // At least one day should have XP
    const hasActivity = result.some(r => r.xpEarned > 0);
    expect(hasActivity).toBe(true);
  });
});
