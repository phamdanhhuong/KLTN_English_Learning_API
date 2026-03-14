import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class GetPublicProfileUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(targetUserId: string, requestingUserId?: string) {
    const [user, streak, followCounts, xpHistory] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true, username: true, fullName: true, profilePictureUrl: true,
          currentLevel: true, xpPoints: true, isActive: true, createdAt: true,
        },
      }),
      this.prisma.streakData.findUnique({ where: { userId: targetUserId } }),
      Promise.all([
        this.prisma.userRelationship.count({ where: { followerId: targetUserId } }),
        this.prisma.userRelationship.count({ where: { followingId: targetUserId } }),
      ]),
      this.prisma.userDailyActivity.findMany({
        where: { userId: targetUserId },
        orderBy: { activityDate: 'desc' },
        take: 7,
        select: { activityDate: true, xpEarned: true },
      }),
    ]);

    if (!user || !user.isActive) throw new NotFoundException('User not found');

    const [followingCount, followerCount] = followCounts;

    let isFollowingMe = false;
    let isFollowedByMe = false;
    if (requestingUserId && requestingUserId !== targetUserId) {
      const [targetFollowsMe, iFollowTarget] = await Promise.all([
        this.prisma.userRelationship.findFirst({
          where: { followerId: targetUserId, followingId: requestingUserId },
        }),
        this.prisma.userRelationship.findFirst({
          where: { followerId: requestingUserId, followingId: targetUserId },
        }),
      ]);
      isFollowingMe = !!targetFollowsMe;
      isFollowedByMe = !!iFollowTarget;
    }

    return {
      id: user.id,
      username: user.username ?? '',
      displayName: user.fullName ?? user.username ?? 'User',
      avatarUrl: user.profilePictureUrl ?? '',
      joinedDate: this.formatDate(user.createdAt),
      countryCode: 'VN',
      followingCount,
      followerCount,
      isFollowingMe,
      isFollowedByMe,
      streakDays: streak?.currentStreak ?? 0,
      totalXp: user.xpPoints ?? 0,
      currentLevel: user.currentLevel ?? 1,
      isInTournament: false,
      top3Count: 0,
      englishScore: 0,
      xpHistory: xpHistory.map(h => ({
        date: h.activityDate.toISOString().split('T')[0],
        xp: h.xpEarned,
      })),
    };
  }

  private formatDate(date: Date): string {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${d}/${m}/${date.getFullYear()}`;
  }
}

@Injectable()
export class SearchUsersUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(username: string, limit = 10) {
    const users = await this.prisma.user.findMany({
      where: {
        username: { contains: username, mode: 'insensitive' },
        isActive: true,
      },
      select: {
        id: true, username: true, fullName: true, profilePictureUrl: true,
        currentLevel: true, xpPoints: true,
      },
      take: limit,
    });

    return users.map(u => ({
      id: u.id,
      username: u.username ?? '',
      displayName: u.fullName ?? u.username ?? 'User',
      avatarUrl: u.profilePictureUrl ?? '',
      currentLevel: u.currentLevel,
      xpPoints: u.xpPoints,
    }));
  }
}
