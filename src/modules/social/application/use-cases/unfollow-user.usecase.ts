import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';

@Injectable()
export class UnfollowUserUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(currentUserId: string, targetUserId: string) {
    const result = await this.prisma.userRelationship.deleteMany({
      where: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });

    if (result.count === 0) {
      throw new BadRequestException('Not following this user');
    }

    // Invalidate cached counts
    await this.redis.del(`social:count:${currentUserId}`);
    await this.redis.del(`social:count:${targetUserId}`);

    return { unfollowed: true, targetUserId };
  }
}
