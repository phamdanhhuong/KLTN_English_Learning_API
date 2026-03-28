import { NotFoundException } from '@nestjs/common';
import { GetPublicProfileUseCase, SearchUsersUseCase } from './get-public-profile.usecase';

describe('GetPublicProfileUseCase', () => {
  let useCase: GetPublicProfileUseCase;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      streakData: { findUnique: jest.fn() },
      userRelationship: { count: jest.fn(), findFirst: jest.fn() },
      userDailyActivity: { findMany: jest.fn() },
    };
    useCase = new GetPublicProfileUseCase(prisma);
  });

  it('should return public profile', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', username: 'test', fullName: 'Test', profilePictureUrl: null,
      currentLevel: 5, xpPoints: 200, isActive: true, createdAt: new Date('2024-01-15'),
    });
    prisma.streakData.findUnique.mockResolvedValue({ currentStreak: 3 });
    prisma.userRelationship.count.mockResolvedValue(0);
    prisma.userDailyActivity.findMany.mockResolvedValue([]);

    const result = await useCase.execute('u1');
    expect(result.id).toBe('u1');
    expect(result.streakDays).toBe(3);
  });

  it('should check follow relationship when requesting user provided', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', username: 'test', fullName: 'Test', profilePictureUrl: null,
      currentLevel: 1, xpPoints: 0, isActive: true, createdAt: new Date(),
    });
    prisma.streakData.findUnique.mockResolvedValue(null);
    prisma.userRelationship.count.mockResolvedValue(0);
    prisma.userRelationship.findFirst.mockResolvedValue(null);
    prisma.userDailyActivity.findMany.mockResolvedValue([]);

    const result = await useCase.execute('u1', 'u2');
    expect(result.isFollowingMe).toBe(false);
    expect(result.isFollowedByMe).toBe(false);
  });

  it('should throw NotFoundException when user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.streakData.findUnique.mockResolvedValue(null);
    prisma.userRelationship.count.mockResolvedValue(0);
    prisma.userDailyActivity.findMany.mockResolvedValue([]);

    await expect(useCase.execute('non-existent')).rejects.toThrow(NotFoundException);
  });
});

describe('SearchUsersUseCase', () => {
  let useCase: SearchUsersUseCase;
  let prisma: any;

  beforeEach(() => {
    prisma = { user: { findMany: jest.fn() } };
    useCase = new SearchUsersUseCase(prisma);
  });

  it('should return matching users', async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: 'u1', username: 'test', fullName: 'Test', profilePictureUrl: null, currentLevel: 1, xpPoints: 0 },
    ]);
    const result = await useCase.execute('test');
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('test');
  });
});
