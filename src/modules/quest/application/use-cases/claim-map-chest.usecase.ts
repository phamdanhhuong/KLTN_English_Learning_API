import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class ClaimMapChestUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    userId: string,
    body: { chestId: string; skillId: string; partId?: string; requiredPosition: number },
  ) {
    const { chestId, skillId, partId, requiredPosition } = body;

    // 1. Verify the skill exists
    const targetSkill = await this.prisma.skill.findUnique({
      where: { id: skillId },
      select: { id: true, position: true, partId: true },
    });

    if (!targetSkill) {
      throw new BadRequestException('Skill không tồn tại!');
    }

    // 2. Get user's current learning progress
    const progress = await this.prisma.skillProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      throw new BadRequestException('Không tìm thấy dữ liệu học tập!');
    }

    // 3. Check if user has progressed past this chest's position
    let canClaim = false;

    if (progress.skillId === skillId) {
      // Same skill: user must have reached beyond the required level
      canClaim = progress.levelReached > requiredPosition;
    } else {
      // Different skill: user's current skill must be positioned after the chest's skill
      const currentSkill = await this.prisma.skill.findUnique({
        where: { id: progress.skillId },
        select: { position: true, partId: true },
      });

      if (currentSkill) {
        // If different parts, compare part positions
        if (targetSkill.partId !== currentSkill.partId) {
          const targetPart = await this.prisma.skillPart.findUnique({
            where: { id: targetSkill.partId },
            select: { position: true },
          });
          const currentPart = await this.prisma.skillPart.findUnique({
            where: { id: currentSkill.partId },
            select: { position: true },
          });
          canClaim = (targetPart?.position ?? 0) < (currentPart?.position ?? 0);
        } else {
          // Same part: compare skill positions
          canClaim = targetSkill.position < currentSkill.position;
        }
      }
    }

    if (!canClaim) {
      throw new BadRequestException('Bạn chưa học đến rương này!');
    }

    // 4. Check if already claimed (prevent double claim)
    const existingClaim = await this.prisma.mapChestClaim.findUnique({
      where: {
        userId_chestId: { userId, chestId },
      },
    });

    if (existingClaim) {
      throw new BadRequestException('Rương này đã được mở rồi!');
    }

    // 5. Claim chest and grant reward in a transaction
    const rewardCoins = 50;

    const result = await this.prisma.$transaction(async (tx) => {
      // Record the claim with full context
      const claim = await tx.mapChestClaim.create({
        data: {
          userId,
          chestId,
          skillId,
          partId: partId || targetSkill.partId,
          rewardCoins,
        },
      });

      // Grant coins to user
      await tx.userCurrency.upsert({
        where: { userId },
        create: { userId, coins: 100 + rewardCoins },
        update: { coins: { increment: rewardCoins } },
      });

      // Log the transaction
      await tx.currencyTransaction.create({
        data: {
          userId,
          currencyType: 'COINS',
          amount: rewardCoins,
          reason: 'CHEST_OPENED',
          metadata: {
            chestId,
            skillId,
            partId: partId || targetSkill.partId,
            source: 'MAP_CHEST',
          },
        },
      });

      return claim;
    });

    return {
      data: {
        id: result.id,
        chestId: result.chestId,
        rewardCoins,
        message: `Nhận thành công ${rewardCoins} Vàng! 💰`,
      },
    };
  }

  /**
   * Get all claimed chest IDs for a user (used by frontend to mark opened chests)
   */
  async getClaimedChests(userId: string, partId?: string) {
    const where: any = { userId };
    if (partId) where.partId = partId;

    const claims = await this.prisma.mapChestClaim.findMany({
      where,
      select: { chestId: true },
    });

    return claims.map((c) => c.chestId);
  }
}
