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
      userLeagueTier: { findUnique: jest.fn() },
      leagueParticipant: { findFirst: jest.fn() },
      leagueHistory: { count: jest.fn() },
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
    prisma.userLeagueTier.findUnique.mockResolvedValue({ currentTier: 'GOLD' });
    prisma.leagueParticipant.findFirst.mockResolvedValue(null);
    prisma.leagueHistory.count.mockResolvedValue(2);

    const result = await useCase.execute('u1');

    expect(result.id).toBe('u1');
    expect(result.username).toBe('testuser');
    expect(result.displayName).toBe('Test User');
    expect(result.streakDays).toBe(7);
    expect(result.totalExp).toBe(100);
    expect(result.currentLeagueTier).toBe('GOLD');
    expect(result.isInTournament).toBe(false);
    expect(result.top3Count).toBe(2);
    expect(result.joinedDate).toBe('15/01/2024');
  });

  it('should return null league tier when user has no tier', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u2', email: 'user2@example.com', username: 'user2', fullName: 'User Two',
      profilePictureUrl: 'https://example.com/avatar.png', currentLevel: 1, xpPoints: 0,
      totalXpEarned: 0, isEmailVerified: false, isActive: true, createdAt: new Date('2025-06-01'),
    });
    prisma.streakData.findUnique.mockResolvedValue(null);
    prisma.userRelationship.count.mockResolvedValue(0);
    prisma.userDailyActivity.findMany.mockResolvedValue([]);
    prisma.userLeagueTier.findUnique.mockResolvedValue(null);
    prisma.leagueParticipant.findFirst.mockResolvedValue(null);
    prisma.leagueHistory.count.mockResolvedValue(0);

    const result = await useCase.execute('u2');

    expect(result.currentLeagueTier).toBeNull();
    expect(result.streakDays).toBe(0);
    expect(result.isInTournament).toBe(false);
    expect(result.top3Count).toBe(0);
  });

  it('should detect active tournament participation', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u3', email: 'u3@example.com', username: 'u3', fullName: 'User Three',
      profilePictureUrl: null, currentLevel: 10, xpPoints: 500,
      totalXpEarned: 2000, isEmailVerified: true, isActive: true, createdAt: new Date('2024-03-10'),
    });
    prisma.streakData.findUnique.mockResolvedValue({ currentStreak: 30 });
    prisma.userRelationship.count.mockResolvedValue(5);
    prisma.userDailyActivity.findMany.mockResolvedValue([
      { activityDate: new Date('2025-05-01'), xpEarned: 50 },
      { activityDate: new Date('2025-04-30'), xpEarned: 30 },
    ]);
    prisma.userLeagueTier.findUnique.mockResolvedValue({ currentTier: 'DIAMOND' });
    prisma.leagueParticipant.findFirst.mockResolvedValue({ id: 'lp1', userId: 'u3' });
    prisma.leagueHistory.count.mockResolvedValue(5);

    const result = await useCase.execute('u3');

    expect(result.isInTournament).toBe(true);
    expect(result.top3Count).toBe(5);
    expect(result.currentLeagueTier).toBe('DIAMOND');
    expect(result.xpHistory).toHaveLength(2);
  });

  it('should throw NotFoundException when user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.streakData.findUnique.mockResolvedValue(null);
    prisma.userRelationship.count.mockResolvedValue(0);
    prisma.userDailyActivity.findMany.mockResolvedValue([]);
    prisma.userLeagueTier.findUnique.mockResolvedValue(null);
    prisma.leagueParticipant.findFirst.mockResolvedValue(null);
    prisma.leagueHistory.count.mockResolvedValue(0);

    await expect(useCase.execute('non-existent')).rejects.toThrow(NotFoundException);
  });
});
