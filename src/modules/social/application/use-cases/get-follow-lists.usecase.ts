import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';

@Injectable()
export class GetFollowingUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(userId: string, limit = 50, offset = 0) {
    const relationships = await this.prisma.userRelationship.findMany({
      where: { followerId: userId },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      select: { followingId: true },
    });

    const followingIds = relationships.map((r) => r.followingId);
    if (followingIds.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: followingIds } },
      select: {
        id: true,
        username: true,
        fullName: true,
        profilePictureUrl: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return followingIds.map((id) => {
      const user = userMap.get(id);
      return {
        id,
        username: user?.username || '',
        displayName: user?.fullName || user?.username || 'User',
        avatarUrl: user?.profilePictureUrl || '',
        isFollowing: true,
      };
    });
  }
}

@Injectable()
export class GetFollowersUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(userId: string, limit = 50, offset = 0) {
    const relationships = await this.prisma.userRelationship.findMany({
      where: { followingId: userId },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      select: { followerId: true },
    });

    const followerIds = relationships.map((r) => r.followerId);
    if (followerIds.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: followerIds } },
      select: {
        id: true,
        username: true,
        fullName: true,
        profilePictureUrl: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Check mutual follows
    const mutuals = await this.prisma.userRelationship.findMany({
      where: {
        followerId: userId,
        followingId: { in: followerIds },
      },
      select: { followingId: true },
    });
    const mutualSet = new Set(mutuals.map((m) => m.followingId));

    return followerIds.map((id) => {
      const user = userMap.get(id);
      return {
        id,
        username: user?.username || '',
        displayName: user?.fullName || user?.username || 'User',
        avatarUrl: user?.profilePictureUrl || '',
        isFollowing: mutualSet.has(id),
      };
    });
  }
}
