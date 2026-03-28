import { Injectable, Inject, Logger } from '@nestjs/common';
import { QUEST_TOKENS } from '../../domain/di/tokens';
import type { QuestRepository } from '../../domain/repositories/quest.repository.interface';
import type { UserQuestRepository } from '../../domain/repositories/user-quest.repository.interface';
import { FeedService } from '../../../feed/application/services/feed.service';

/**
 * QuestService — đơn giản hóa DifficultyService + ChestService vào 1 service.
 */
@Injectable()
export class QuestService {
  private readonly logger = new Logger(QuestService.name);

  constructor(
    @Inject(QUEST_TOKENS.QUEST_REPOSITORY)
    private readonly questRepo: QuestRepository,
    @Inject(QUEST_TOKENS.USER_QUEST_REPOSITORY)
    private readonly userQuestRepo: UserQuestRepository,
    private readonly feedService: FeedService,
  ) {}

  /** Lấy tất cả quest definitions (cached) */
  async getQuestDefinitions() {
    return this.questRepo.findAllActive();
  }

  /** Init daily quests cho user (3 quests: BRONZE, SILVER, GOLD) */
  async initializeDailyQuests(userId: string) {
    const allQuests = await this.questRepo.findAllActive();
    const dailyQuests = allQuests.filter((q) => q.type === 'DAILY');
    const now = new Date();
    const endOfDay = this.getEndOfDay(now);

    const created: any[] = [];

    for (const quest of dailyQuests) {
      const existing = await this.userQuestRepo.findExisting(userId, quest.id, now);

      if (!existing) {
        const userQuest = await this.userQuestRepo.create({
          userId,
          questId: quest.id,
          requirement: quest.baseRequirement,
          startDate: now,
          endDate: endOfDay,
        });

        if (quest.chestType) {
          await this.userQuestRepo.createChest(
            userQuest.id,
            quest.chestType,
            this.getChestRewards(quest.chestType),
          );
        }

        created.push(userQuest);
      }
    }

    return created;
  }

  /** Init weekly (friends) quests */
  async initializeWeeklyQuests(userId: string) {
    const allQuests = await this.questRepo.findAllActive();
    const friendsQuests = allQuests.filter((q) => q.type === 'FRIENDS');
    const now = new Date();
    const endOfWeek = this.getEndOfWeek(now);

    const created: any[] = [];

    for (const quest of friendsQuests) {
      const existing = await this.userQuestRepo.findExisting(userId, quest.id, now);

      if (!existing) {
        const userQuest = await this.userQuestRepo.create({
          userId,
          questId: quest.id,
          requirement: quest.baseRequirement,
          startDate: now,
          endDate: endOfWeek,
        });

        if (quest.chestType) {
          await this.userQuestRepo.createChest(
            userQuest.id,
            quest.chestType,
            this.getChestRewards(quest.chestType),
          );
        }

        created.push(userQuest);
      }
    }

    return created;
  }

  /** Check + reset expired quests + init mới */
  async checkAndInitQuests(userId: string) {
    await this.userQuestRepo.markExpired(userId);
    await this.initializeDailyQuests(userId);
    await this.initializeWeeklyQuests(userId);
  }

  /** Update quest progress bằng category */
  async updateQuestProgress(userId: string, category: string, amount: number) {
    const activeQuests = await this.userQuestRepo.findActiveByUser(userId);

    const SPECIAL_KEYS = ['challenge_perfectionist'];
    const relevant = activeQuests.filter(
      (uq) => uq.quest.category === category && !SPECIAL_KEYS.includes(uq.quest.key),
    );

    for (const uq of relevant) {
      const newProgress = Math.min(uq.progress + amount, uq.requirement);

      if (newProgress > uq.progress) {
        const isCompleted = newProgress >= uq.requirement;

        await this.userQuestRepo.updateProgress(uq.id, newProgress, isCompleted);

        if (isCompleted) {
          await this.userQuestRepo.unlockChest(uq.id);

          // Feed auto-create: QUEST_COMPLETED
          const chestType = uq.quest.chestType;
          if (chestType === 'GOLD' || chestType === 'LEGENDARY') {
            this.feedService.autoCreatePost(userId, 'QUEST_COMPLETED', {
              questName: uq.quest.name,
              isSpecial: true,
            }).catch(() => {});
          }
        }
      }
    }

    await this.userQuestRepo.invalidateCache(userId);
  }

  /** Update quest progress by specific quest key */
  async updateQuestByKey(userId: string, questKey: string, amount: number) {
    const activeQuests = await this.userQuestRepo.findActiveByUser(userId);
    const activeQuest = activeQuests.find((uq) => uq.quest.key === questKey);

    if (!activeQuest) return;

    const newProgress = Math.min(activeQuest.progress + amount, activeQuest.requirement);

    if (newProgress > activeQuest.progress) {
      const isCompleted = newProgress >= activeQuest.requirement;

      await this.userQuestRepo.updateProgress(activeQuest.id, newProgress, isCompleted);

      if (isCompleted) {
        await this.userQuestRepo.unlockChest(activeQuest.id);
      }
    }

    await this.userQuestRepo.invalidateCache(userId);
  }

  /**
   * Increment contribution for all Friends Quest groups the user is part of this week.
   */
  async updateFriendsQuestContribution(userId: string): Promise<void> {
    const weekStart = this.getWeekStart(new Date());
    await this.userQuestRepo.updateFriendsContribution(userId, weekStart);
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

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
