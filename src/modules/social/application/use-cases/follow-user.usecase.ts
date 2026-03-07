import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';

@Injectable()
export class FollowUserUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    // Check if target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    if (!targetUser) {
      throw new BadRequestException('User not found');
    }

    // Check if blocked
    const blocked = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: currentUserId, blockedUserId: targetUserId },
          { blockerId: targetUserId, blockedUserId: currentUserId },
        ],
      },
    });
    if (blocked) {
      throw new BadRequestException('Cannot follow this user');
    }

    // Check if already following
    const existing = await this.prisma.userRelationship.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });
    if (existing) {
      throw new ConflictException('Already following this user');
    }

    await this.prisma.userRelationship.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });

    // Invalidate cached counts
    await this.redis.del(`social:count:${currentUserId}`);
    await this.redis.del(`social:count:${targetUserId}`);
    await this.redis.del(`social:suggest:${currentUserId}`);

    return { followed: true, targetUserId };
  }
}
