import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';
import type { QuestRepository, QuestDefinition } from '../../domain/repositories/quest.repository.interface';

@Injectable()
export class PrismaQuestRepository implements QuestRepository {
  private readonly DEFS_CACHE_KEY = 'quest:defs';
  private readonly DEFS_CACHE_TTL = 3600;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findAllActive(): Promise<QuestDefinition[]> {
    const cached = await this.redis.get(this.DEFS_CACHE_KEY);
    if (cached) return JSON.parse(cached);

    const quests = await this.prisma.quest.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { order: 'asc' }],
    });

    await this.redis.set(this.DEFS_CACHE_KEY, JSON.stringify(quests), this.DEFS_CACHE_TTL);
    return quests as unknown as QuestDefinition[];
  }
}
