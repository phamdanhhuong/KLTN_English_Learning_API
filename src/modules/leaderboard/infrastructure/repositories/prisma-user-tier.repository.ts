import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';
import type { UserTierRepository } from '../../domain/repositories/user-tier.repository.interface';

const TIER_ORDER = [
  'BRONZE', 'SILVER', 'GOLD', 'SAPPHIRE', 'RUBY',
  'EMERALD', 'AMETHYST', 'PEARL', 'OBSIDIAN', 'DIAMOND',
];

@Injectable()
export class PrismaUserTierRepository implements UserTierRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findByUserId(userId: string) {
    const cached = await this.redis.get(`lb:tier:${userId}`);
    if (cached) return JSON.parse(cached);

    const tier = await this.prisma.userLeagueTier.findUnique({ where: { userId } });
    if (tier) {
      await this.redis.set(`lb:tier:${userId}`, JSON.stringify(tier), 86400);
    }
    return tier;
  }

  async create(userId: string) {
    return this.prisma.userLeagueTier.create({
      data: { userId, currentTier: 'BRONZE', highestTier: 'BRONZE' },
    });
  }

  async getOrCreate(userId: string) {
    let tier = await this.findByUserId(userId);
    if (!tier) {
      tier = await this.create(userId);
      await this.redis.set(`lb:tier:${userId}`, JSON.stringify(tier), 86400);
    }
    return tier;
  }

  async updateCurrentGroup(userId: string, groupId: string) {
    await this.prisma.userLeagueTier.update({
      where: { userId },
      data: { currentGroupId: groupId },
    });
  }

  async changeTier(userId: string, direction: 'up' | 'down'): Promise<{ oldTier: string; newTier: string }> {
    const userTier = await this.prisma.userLeagueTier.findUnique({ where: { userId } });
    if (!userTier) return { oldTier: 'BRONZE', newTier: 'BRONZE' };

    const oldTier = userTier.currentTier;
    const currentIndex = TIER_ORDER.indexOf(userTier.currentTier);
    let newIndex = direction === 'up' ? currentIndex + 1 : currentIndex - 1;
    newIndex = Math.max(0, Math.min(newIndex, TIER_ORDER.length - 1));

    const newTier = TIER_ORDER[newIndex] as any;
    const updates: any = {
      currentTier: newTier,
      currentGroupId: null,
    };

    if (direction === 'up') {
      updates.totalPromotions = { increment: 1 };
      if (newIndex > TIER_ORDER.indexOf(userTier.highestTier)) {
        updates.highestTier = newTier;
      }
    } else {
      updates.totalDemotions = { increment: 1 };
    }

    await this.prisma.userLeagueTier.update({
      where: { userId },
      data: updates,
    });

    await this.invalidateCache(userId);
    return { oldTier, newTier };
  }

  async invalidateCache(userId: string) {
    await this.redis.del(`lb:tier:${userId}`);
  }
}
