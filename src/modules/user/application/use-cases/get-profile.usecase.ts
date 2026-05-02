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
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);

    const [user, streak, followCounts, xpHistory, userTier, leagueParticipation, top3Count] = await Promise.all([
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
      this.prisma.userLeagueTier.findUnique({ where: { userId } }),
      this.prisma.leagueParticipant.findFirst({
        where: {
          userId,
          group: {
            league: {
              weekStartDate: weekStart
            }
          }
        }
      }),
      this.prisma.leagueHistory.count({
        where: {
          userId,
          rank: {
            lte: 3
          }
        }
      })
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
      isInTournament: !!leagueParticipation,
      top3Count: top3Count,
      currentLeagueTier: userTier?.currentTier ?? null,
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
