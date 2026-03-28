import { NotFoundException } from '@nestjs/common';
import { GetProfileUseCase } from './get-profile.usecase';

describe('GetProfileUseCase', () => {
  let useCase: GetProfileUseCase;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      streakData: { findUnique: jest.fn() },
      userRelationship: { count: jest.fn() },
      userDailyActivity: { findMany: jest.fn() },
    };
    useCase = new GetProfileUseCase(prisma);
  });

  it('should return formatted profile data', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'test@example.com', username: 'testuser', fullName: 'Test User',
      profilePictureUrl: null, currentLevel: 5, xpPoints: 100,
      totalXpEarned: 500, isEmailVerified: true, isActive: true, createdAt: new Date('2024-01-15'),
    });
    prisma.streakData.findUnique.mockResolvedValue({ currentStreak: 7 });
    prisma.userRelationship.count.mockResolvedValue(0);
    prisma.userDailyActivity.findMany.mockResolvedValue([]);

    const result = await useCase.execute('u1');

    expect(result.id).toBe('u1');
    expect(result.username).toBe('testuser');
    expect(result.displayName).toBe('Test User');
    expect(result.streakDays).toBe(7);
    expect(result.totalExp).toBe(100);
  });

  it('should throw NotFoundException when user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.streakData.findUnique.mockResolvedValue(null);
    prisma.userRelationship.count.mockResolvedValue(0);
    prisma.userDailyActivity.findMany.mockResolvedValue([]);

    await expect(useCase.execute('non-existent')).rejects.toThrow(NotFoundException);
  });
});
