import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';
import type { SocialRepository } from '../../domain/repositories/social.repository.interface';

@Injectable()
export class PrismaSocialRepository implements SocialRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const rel = await this.prisma.userRelationship.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return !!rel;
  }

  async isBlocked(userId1: string, userId2: string): Promise<boolean> {
    const block = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId1, blockedUserId: userId2 },
          { blockerId: userId2, blockedUserId: userId1 },
        ],
      },
    });
    return !!block;
  }

  async follow(followerId: string, followingId: string): Promise<void> {
    await this.prisma.userRelationship.create({
      data: { followerId, followingId },
    });
    await this.invalidateSocialCaches(followerId, followingId);
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    const result = await this.prisma.userRelationship.deleteMany({
      where: { followerId, followingId },
    });
    if (result.count === 0) {
      throw new Error('NOT_FOLLOWING');
    }
    await this.invalidateSocialCaches(followerId, followingId);
  }

  async getFollowing(userId: string): Promise<any[]> {
    const relationships = await this.prisma.userRelationship.findMany({
      where: { followerId: userId },
      orderBy: { createdAt: 'desc' },
      select: { followingId: true },
    });

    const ids = relationships.map((r) => r.followingId);
    if (ids.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, username: true, fullName: true, profilePictureUrl: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));
    return ids.map((id) => {
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

  async getFollowers(userId: string): Promise<any[]> {
    const relationships = await this.prisma.userRelationship.findMany({
      where: { followingId: userId },
      orderBy: { createdAt: 'desc' },
      select: { followerId: true },
    });

    const ids = relationships.map((r) => r.followerId);
    if (ids.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, username: true, fullName: true, profilePictureUrl: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Check mutual follows
    const mutuals = await this.prisma.userRelationship.findMany({
      where: { followerId: userId, followingId: { in: ids } },
      select: { followingId: true },
    });
    const mutualSet = new Set(mutuals.map((m) => m.followingId));

    return ids.map((id) => {
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

  async getFollowingIds(userId: string): Promise<string[]> {
    const relations = await this.prisma.userRelationship.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    return relations.map((r) => r.followingId);
  }

  async searchUsers(excludeIds: string[], searchTerm: string): Promise<any[]> {
    return this.prisma.user.findMany({
      where: {
        id: { notIn: excludeIds },
        OR: [
          { username: { contains: searchTerm, mode: 'insensitive' } },
          { fullName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: { id: true, username: true, fullName: true, profilePictureUrl: true },
      take: 20,
    });
  }

  async getSuggestedUsers(excludeIds: string[], limit = 10): Promise<any[]> {
    return this.prisma.user.findMany({
      where: { id: { notIn: excludeIds } },
      select: { id: true, username: true, fullName: true, profilePictureUrl: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getBlockedIds(userId: string): Promise<string[]> {
    const blocks = await this.prisma.userBlock.findMany({
      where: {
        OR: [
          { blockerId: userId },
          { blockedUserId: userId },
        ],
      },
      select: { blockerId: true, blockedUserId: true },
    });
    return blocks.map((b) =>
      b.blockerId === userId ? b.blockedUserId : b.blockerId,
    );
  }

  async getFollowerCount(userId: string): Promise<number> {
    return this.prisma.userRelationship.count({
      where: { followingId: userId },
    });
  }

  async getUserBasicInfo(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, fullName: true },
    });
  }

  async getFollowingIdsFromList(currentUserId: string, userIds: string[]): Promise<Set<string>> {
    const relations = await this.prisma.userRelationship.findMany({
      where: {
        followerId: currentUserId,
        followingId: { in: userIds },
      },
      select: { followingId: true },
    });
    return new Set(relations.map((r) => r.followingId));
  }

  // ─── Friends of friends (for suggestions) ───

  async getFriendsOfFriends(followingIds: string[], excludeIds: string[]): Promise<any[]> {
    const fof = await this.prisma.userRelationship.findMany({
      where: {
        followerId: { in: followingIds },
        followingId: { notIn: excludeIds },
      },
      select: { followingId: true },
      take: 50,
    });

    const fofIds = [...new Set(fof.map((f) => f.followingId))];
    if (fofIds.length === 0) return [];

    return this.prisma.user.findMany({
      where: { id: { in: fofIds } },
      select: { id: true, username: true, fullName: true, profilePictureUrl: true },
      take: 10,
    });
  }

  async userExists(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    return !!user;
  }

  private async invalidateSocialCaches(userId1: string, userId2: string) {
    await this.redis.del(`social:count:${userId1}`);
    await this.redis.del(`social:count:${userId2}`);
    await this.redis.del(`social:suggest:${userId1}`);
  }
}
