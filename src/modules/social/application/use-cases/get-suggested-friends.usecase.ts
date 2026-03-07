import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';

export interface SuggestedUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isFollowing: boolean;
  subtext?: string;
}

@Injectable()
export class GetSuggestedFriendsUseCase {
  private readonly CACHE_TTL = 1800; // 30 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(currentUserId: string): Promise<SuggestedUser[]> {
    // Check Redis cache
    const cached = await this.redis.get(`social:suggest:${currentUserId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get users already followed
    const following = await this.prisma.userRelationship.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    // Get blocked users (both directions)
    const blocks = await this.prisma.userBlock.findMany({
      where: {
        OR: [
          { blockerId: currentUserId },
          { blockedUserId: currentUserId },
        ],
      },
      select: { blockerId: true, blockedUserId: true },
    });
    const blockedIds = blocks.map((b) =>
      b.blockerId === currentUserId ? b.blockedUserId : b.blockerId,
    );

    const excludeIds: string[] = [...new Set([...followingIds, ...blockedIds, currentUserId])];

    // Strategy 1: Friends of friends (mutual connections)
    let suggestions: SuggestedUser[] = [];

    if (followingIds.length > 0) {
      const friendsOfFriends = await this.prisma.userRelationship.findMany({
        where: {
          followerId: { in: followingIds },
          followingId: { notIn: excludeIds },
        },
        select: { followingId: true },
        take: 50,
      });

      const fofIds = [...new Set(friendsOfFriends.map((f) => f.followingId))];

      if (fofIds.length > 0) {
        const fofUsers = await this.prisma.user.findMany({
          where: { id: { in: fofIds } },
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePictureUrl: true,
          },
          take: 10,
        });

        suggestions = fofUsers.map((user) => ({
          id: user.id,
          username: user.username || '',
          displayName: user.fullName || user.username || 'User',
          avatarUrl: user.profilePictureUrl || '',
          isFollowing: false,
          subtext: 'Bạn có thể quen',
        }));
      }
    }

    // Strategy 2: Fill remaining with recent active users
    if (suggestions.length < 10) {
      const existingIds = [...excludeIds, ...suggestions.map((s) => s.id)];
      const remaining = 10 - suggestions.length;

      const recentUsers = await this.prisma.user.findMany({
        where: { id: { notIn: existingIds } },
        select: {
          id: true,
          username: true,
          fullName: true,
          profilePictureUrl: true,
        },
        orderBy: { createdAt: 'desc' },
        take: remaining,
      });

      suggestions.push(
        ...recentUsers.map((user) => ({
          id: user.id,
          username: user.username || '',
          displayName: user.fullName || user.username || 'User',
          avatarUrl: user.profilePictureUrl || '',
          isFollowing: false,
          subtext: 'Gợi ý cho bạn',
        })),
      );
    }

    // Cache result
    await this.redis.set(
      `social:suggest:${currentUserId}`,
      JSON.stringify(suggestions),
      this.CACHE_TTL,
    );

    return suggestions;
  }
}
