import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';
import type { UserQuestRepository, UserQuestWithQuest } from '../../domain/repositories/user-quest.repository.interface';
import { QuestStatus } from '@prisma/client';

@Injectable()
export class PrismaUserQuestRepository implements UserQuestRepository {
  private readonly logger = new Logger(PrismaUserQuestRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findExisting(userId: string, questId: string, minEndDate: Date): Promise<any | null> {
    return this.prisma.userQuest.findFirst({
      where: {
        userId,
        questId,
        status: { in: ['ACTIVE', 'COMPLETED'] },
        endDate: { gte: minEndDate },
      },
    });
  }

  async create(data: {
    userId: string;
    questId: string;
    requirement: number;
    startDate: Date;
    endDate: Date;
  }): Promise<any> {
    return this.prisma.userQuest.create({ data });
  }

  async createChest(userQuestId: string, chestType: string, rewards: Record<string, number>): Promise<void> {
    await this.prisma.questChest.create({
      data: {
        userQuestId,
        chestType: chestType as any,
        ...rewards,
      },
    });
  }

  async findActiveByUser(userId: string): Promise<UserQuestWithQuest[]> {
    const quests = await this.prisma.userQuest.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { quest: true },
    });
    return quests as unknown as UserQuestWithQuest[];
  }

  async updateProgress(id: string, progress: number, isCompleted: boolean): Promise<void> {
    await this.prisma.userQuest.update({
      where: { id },
      data: {
        progress,
        ...(isCompleted
          ? { status: 'COMPLETED' as QuestStatus, completedAt: new Date() }
          : {}),
      },
    });
  }

  async unlockChest(userQuestId: string): Promise<void> {
    await this.prisma.questChest.updateMany({
      where: { userQuestId, status: 'LOCKED' },
      data: { status: 'UNLOCKED', unlockedAt: new Date() },
    });
  }

  async markExpired(userId: string): Promise<void> {
    await this.prisma.userQuest.updateMany({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });
  }

  async updateFriendsContribution(userId: string, weekStart: Date): Promise<void> {
    try {
      // 1. Increment this user's contribution in all quest groups they belong to
      await this.prisma.friendsQuestParticipant.updateMany({
        where: { userId, weekStartDate: weekStart },
        data: { contribution: { increment: 1 } },
      });

      // 2. Find all quest groups this user is in this week
      const userParticipations = await this.prisma.friendsQuestParticipant.findMany({
        where: { userId, weekStartDate: weekStart },
        select: { questKey: true },
      });

      // 3. For each quest group, compute total contribution and update UserQuest.progress
      for (const { questKey } of userParticipations) {
        const aggregate = await this.prisma.friendsQuestParticipant.aggregate({
          where: { questKey, weekStartDate: weekStart },
          _sum: { contribution: true },
        });
        const totalContribution = aggregate._sum.contribution ?? 0;

        // Find all participant userIds in this group
        const participants = await this.prisma.friendsQuestParticipant.findMany({
          where: { questKey, weekStartDate: weekStart },
          select: { userId: true },
        });
        const participantUserIds = participants.map(p => p.userId);

        // Find the Quest definition matching this questKey
        const questDef = await this.prisma.quest.findUnique({
          where: { key: questKey },
          select: { id: true },
        });
        if (!questDef) continue;

        // Update UserQuest.progress for all participants
        for (const pUserId of participantUserIds) {
          const userQuest = await this.prisma.userQuest.findFirst({
            where: {
              userId: pUserId,
              questId: questDef.id,
              status: 'ACTIVE',
            },
          });
          if (userQuest) {
            const newProgress = Math.min(totalContribution, userQuest.requirement);
            const isCompleted = newProgress >= userQuest.requirement;
            await this.prisma.userQuest.update({
              where: { id: userQuest.id },
              data: {
                progress: newProgress,
                ...(isCompleted && !userQuest.completedAt
                  ? { status: 'COMPLETED', completedAt: new Date() }
                  : {}),
              },
            });
            if (isCompleted && !userQuest.completedAt) {
              // Unlock chest if exists
              await this.prisma.questChest.updateMany({
                where: { userQuestId: userQuest.id, status: 'LOCKED' },
                data: { status: 'UNLOCKED', unlockedAt: new Date() },
              });
            }
          }
        }
      }
    } catch (e) {
      this.logger.warn(`updateFriendsContribution failed for ${userId}: ${e}`);
    }
  }

  async invalidateCache(userId: string): Promise<void> {
    await this.redis.del(`quest:user:${userId}`);
  }
}
