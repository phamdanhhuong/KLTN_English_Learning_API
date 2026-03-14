import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

/**
 * Returns profile data formatted to match mobile ProfileModel.fromJson:
 * id, username, displayName, avatarUrl, joinedDate (DD/MM/YYYY), countryCode,
 * followingCount, followerCount, streakDays, totalExp, isInTournament,
 * top3Count, currentLeagueTier, skillPosition, xpHistory[]
 */
@Injectable()
export class GetProfileUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string) {
    const [user, streak, followCounts, xpHistory] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, email: true, username: true, fullName: true,
          profilePictureUrl: true, currentLevel: true, xpPoints: true,
          totalXpEarned: true, isEmailVerified: true, isActive: true, createdAt: true,
        },
      }),
      this.prisma.streakData.findUnique({ where: { userId } }),
      Promise.all([
        this.prisma.userRelationship.count({ where: { followerId: userId } }),
        this.prisma.userRelationship.count({ where: { followingId: userId } }),
      ]),
      this.prisma.userDailyActivity.findMany({
        where: { userId },
        orderBy: { activityDate: 'desc' },
        take: 7,
        select: { activityDate: true, xpEarned: true },
      }),
    ]);

    if (!user) throw new NotFoundException('User profile not found');

    const [followingCount, followerCount] = followCounts;

    return {
      id: user.id,
      email: user.email,
      username: user.username ?? '',
      displayName: user.fullName ?? user.username ?? 'User',
      avatarUrl: user.profilePictureUrl ?? '',
      joinedDate: this.formatDate(user.createdAt),
      countryCode: 'VN',
      followingCount,
      followerCount,
      streakDays: streak?.currentStreak ?? 0,
      totalExp: user.xpPoints ?? 0,
      totalXp: user.xpPoints ?? 0,         // alias for consistency
      currentLevel: user.currentLevel ?? 1,
      isInTournament: false,
      top3Count: 0,
      currentLeagueTier: null as string | null,
      skillPosition: 1,
      isEmailVerified: user.isEmailVerified,
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
