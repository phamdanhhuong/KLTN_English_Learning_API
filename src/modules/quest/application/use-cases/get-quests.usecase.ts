import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';
import { QuestService } from '../services/quest.service';

@Injectable()
export class GetUserQuestsUseCase {
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly questService: QuestService,
  ) {}

  async execute(userId: string, activeOnly = false) {
    // Auto-init quests
    await this.questService.checkAndInitQuests(userId);

    const cacheKey = `quest:user:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      if (activeOnly) return data.filter((q: any) => q.status === 'ACTIVE');
      return data;
    }

    const quests = await this.prisma.userQuest.findMany({
      where: { userId, status: { in: ['ACTIVE', 'COMPLETED'] } },
      include: {
        quest: true,
        chest: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.redis.set(cacheKey, JSON.stringify(quests), this.CACHE_TTL);

    if (activeOnly) return quests.filter((q) => q.status === 'ACTIVE');
    return quests;
  }
}

@Injectable()
export class GetCompletedQuestsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string) {
    return this.prisma.userQuest.findMany({
      where: { userId, status: 'COMPLETED' },
      include: { quest: true, chest: true },
      orderBy: { completedAt: 'desc' },
    });
  }
}
