import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

export interface PublicUserProfile {
  userId: string;
  username: string | null;
  fullName: string | null;
  profilePictureUrl: string | null;
  currentLevel: number;
  xpPoints: number;
  currentStreak: number;
  longestStreak: number;
}

@Injectable()
export class GetPublicProfileUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(targetUserId: string): Promise<PublicUserProfile> {
    const [user, streak] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, username: true, fullName: true, profilePictureUrl: true,
          currentLevel: true, xpPoints: true, isActive: true },
      }),
      this.prisma.streakData.findUnique({ where: { userId: targetUserId } }),
    ]);

    if (!user || !user.isActive) throw new NotFoundException('User not found');

    return {
      userId: user.id, username: user.username, fullName: user.fullName,
      profilePictureUrl: user.profilePictureUrl, currentLevel: user.currentLevel,
      xpPoints: user.xpPoints, currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
    };
  }
}

@Injectable()
export class SearchUsersUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(username: string, limit = 10): Promise<PublicUserProfile[]> {
    const users = await this.prisma.user.findMany({
      where: {
        username: { contains: username, mode: 'insensitive' },
        isActive: true,
      },
      select: { id: true, username: true, fullName: true, profilePictureUrl: true,
        currentLevel: true, xpPoints: true },
      take: limit,
    });

    return users.map(u => ({
      userId: u.id, username: u.username, fullName: u.fullName,
      profilePictureUrl: u.profilePictureUrl, currentLevel: u.currentLevel,
      xpPoints: u.xpPoints, currentStreak: 0, longestStreak: 0,
    }));
  }
}
