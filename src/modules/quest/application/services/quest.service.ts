import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';
import { QuestStatus } from '@prisma/client';

/**
 * QuestService — đơn giản hóa DifficultyService + ChestService vào 1 service.
 */
@Injectable()
export class QuestService {
  private readonly logger = new Logger(QuestService.name);
  private readonly DEFS_CACHE_KEY = 'quest:defs';
  private readonly DEFS_CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Lây tất cả quest definitions (cached) */
  async getQuestDefinitions() {
    const cached = await this.redis.get(this.DEFS_CACHE_KEY);
    if (cached) return JSON.parse(cached);

    const quests = await this.prisma.quest.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { order: 'asc' }],
    });

    await this.redis.set(this.DEFS_CACHE_KEY, JSON.stringify(quests), this.DEFS_CACHE_TTL);
    return quests;
  }

  /** Init daily quests cho user (3 quests: BRONZE, SILVER, GOLD) */
  async initializeDailyQuests(userId: string) {
    const allQuests = await this.getQuestDefinitions();
    const dailyQuests = allQuests.filter((q: any) => q.type === 'DAILY');
    const now = new Date();
    const endOfDay = this.getEndOfDay(now);

    const created: any[] = [];

    for (const quest of dailyQuests) {
      const existing = await this.prisma.userQuest.findFirst({
        where: {
          userId,
          questId: quest.id,
          status: { in: ['ACTIVE', 'COMPLETED'] },
          endDate: { gte: now },
        },
      });

      if (!existing) {
        const requirement = quest.baseRequirement;

        const userQuest = await this.prisma.userQuest.create({
          data: {
            userId,
            questId: quest.id,
            requirement,
            startDate: now,
            endDate: endOfDay,
          },
        });

        // Create chest
        if (quest.chestType) {
          await this.prisma.questChest.create({
            data: {
              userQuestId: userQuest.id,
              chestType: quest.chestType,
              ...this.getChestRewards(quest.chestType),
            },
          });
        }

        created.push(userQuest);
      }
    }

    return created;
  }

  /** Init weekly (friends) quests */
  async initializeWeeklyQuests(userId: string) {
    const allQuests = await this.getQuestDefinitions();
    const friendsQuests = allQuests.filter((q: any) => q.type === 'FRIENDS');
    const now = new Date();
    const endOfWeek = this.getEndOfWeek(now);

    const created: any[] = [];

    for (const quest of friendsQuests) {
      const existing = await this.prisma.userQuest.findFirst({
        where: {
          userId,
          questId: quest.id,
          status: { in: ['ACTIVE', 'COMPLETED'] },
          endDate: { gte: now },
        },
      });

      if (!existing) {
        const userQuest = await this.prisma.userQuest.create({
          data: {
            userId,
            questId: quest.id,
            requirement: quest.baseRequirement,
            startDate: now,
            endDate: endOfWeek,
          },
        });

        if (quest.chestType) {
          await this.prisma.questChest.create({
            data: {
              userQuestId: userQuest.id,
              chestType: quest.chestType,
              ...this.getChestRewards(quest.chestType),
            },
          });
        }

        created.push(userQuest);
      }
    }

    return created;
  }

  /** Check + reset expired quests + init mới */
  async checkAndInitQuests(userId: string) {
    // Mark expired
    await this.prisma.userQuest.updateMany({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });

    await this.initializeDailyQuests(userId);
    await this.initializeWeeklyQuests(userId);
  }

  /** Update quest progress bằng category */
  async updateQuestProgress(userId: string, category: string, amount: number) {
    const activeQuests = await this.prisma.userQuest.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { quest: true },
    });

    const relevant = activeQuests.filter((uq) => uq.quest.category === category);

    for (const uq of relevant) {
      const newProgress = Math.min(uq.progress + amount, uq.requirement);

      if (newProgress > uq.progress) {
        const isCompleted = newProgress >= uq.requirement;

        await this.prisma.userQuest.update({
          where: { id: uq.id },
          data: {
            progress: newProgress,
            ...(isCompleted
              ? { status: 'COMPLETED' as QuestStatus, completedAt: new Date() }
              : {}),
          },
        });

        // Unlock chest if completed
        if (isCompleted) {
          await this.prisma.questChest.updateMany({
            where: { userQuestId: uq.id, status: 'LOCKED' },
            data: { status: 'UNLOCKED', unlockedAt: new Date() },
          });
        }
      }
    }

    // Invalidate cache
    await this.redis.del(`quest:user:${userId}`);
  }

  /** Chest rewards dựa trên type */
  private getChestRewards(chestType: string) {
    const rewards: Record<string, any> = {
      BRONZE: { rewardXp: 10, rewardGems: 1, rewardCoins: 25 },
      SILVER: { rewardXp: 25, rewardGems: 3, rewardCoins: 50 },
      GOLD: { rewardXp: 50, rewardGems: 5, rewardCoins: 100 },
      LEGENDARY: { rewardXp: 100, rewardGems: 10, rewardCoins: 250, xpBoostMinutes: 30 },
    };
    return rewards[chestType] || rewards.BRONZE;
  }

  private getEndOfDay(date: Date): Date {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  private getEndOfWeek(date: Date): Date {
    const end = new Date(date);
    const day = end.getDay();
    const diff = day === 0 ? 0 : 7 - day;
    end.setDate(end.getDate() + diff);
    end.setHours(23, 59, 59, 999);
    return end;
  }
}
