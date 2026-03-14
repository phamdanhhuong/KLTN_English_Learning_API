import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';

@Injectable()
export class ClaimQuestUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(userId: string, questId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Find completed, unclaimed quest — try by questId (definition) first, then by userQuest id (instance)
      let userQuest = await tx.userQuest.findFirst({
        where: { userId, questId, status: 'COMPLETED' },
        include: { quest: true },
      });

      if (!userQuest) {
        // Fallback: mobile may pass the userQuest instance ID
        userQuest = await tx.userQuest.findFirst({
          where: { id: questId, userId, status: 'COMPLETED' },
          include: { quest: true },
        });
      }

      if (!userQuest) {
        throw new NotFoundException('Completed quest not found or already claimed');
      }

      // Mark as claimed
      await tx.userQuest.update({
        where: { id: userQuest.id },
        data: { status: 'CLAIMED', claimedAt: new Date() },
      });

      // Grant XP
      if (userQuest.quest.rewardXp > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            xpPoints: { increment: userQuest.quest.rewardXp },
            totalXpEarned: { increment: userQuest.quest.rewardXp },
          },
        });
      }

      // Grant gems
      if (userQuest.quest.rewardGems > 0) {
        await tx.userCurrency.update({
          where: { userId },
          data: { gems: { increment: userQuest.quest.rewardGems } },
        });

        await tx.currencyTransaction.create({
          data: {
            userId,
            amount: userQuest.quest.rewardGems,
            currencyType: 'GEMS',
            reason: 'QUEST_REWARD',
            metadata: { questKey: userQuest.quest.key },
          },
        });
      }

      // Invalidate cache
      await this.redis.del(`quest:user:${userId}`);

      // Return full updated userQuest for mobile to update UI
      const updatedQuest = await tx.userQuest.findUnique({
        where: { id: userQuest.id },
        include: { quest: true },
      });

      return updatedQuest;
    });
  }
}

@Injectable()
export class GetUnlockedChestsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string) {
    return this.prisma.questChest.findMany({
      where: {
        status: 'UNLOCKED',
        userQuest: { userId },
      },
      include: { userQuest: { include: { quest: true } } },
    });
  }
}

@Injectable()
export class OpenChestUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(userId: string, chestId: string) {
    return this.prisma.$transaction(async (tx) => {
      const chest = await tx.questChest.findFirst({
        where: {
          id: chestId,
          status: 'UNLOCKED',
          userQuest: { userId },
        },
      });

      if (!chest) {
        throw new NotFoundException('Unlocked chest not found');
      }

      // Mark as opened
      await tx.questChest.update({
        where: { id: chestId },
        data: { status: 'OPENED', openedAt: new Date() },
      });

      // Grant rewards
      if (chest.rewardXp > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            xpPoints: { increment: chest.rewardXp },
            totalXpEarned: { increment: chest.rewardXp },
          },
        });
      }

      if (chest.rewardGems > 0) {
        await tx.userCurrency.update({
          where: { userId },
          data: { gems: { increment: chest.rewardGems } },
        });
      }

      if (chest.rewardCoins > 0) {
        await tx.userCurrency.update({
          where: { userId },
          data: { coins: { increment: chest.rewardCoins } },
        });
      }

      await this.redis.del(`quest:user:${userId}`);

      return {
        opened: true,
        rewards: {
          xp: chest.rewardXp,
          gems: chest.rewardGems,
          coins: chest.rewardCoins,
          xpBoostMinutes: chest.xpBoostMinutes,
        },
      };
    });
  }
}
