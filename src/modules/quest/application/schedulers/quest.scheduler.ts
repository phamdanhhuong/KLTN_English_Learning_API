import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';

@Injectable()
export class QuestScheduler {
  private readonly logger = new Logger(QuestScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Reset expired quests — runs daily at 00:05 Vietnam time (17:05 UTC) */
  @Cron('5 17 * * *')
  async handleDailyQuestReset() {
    this.logger.log('🔄 Running daily quest reset...');

    try {
      const now = new Date();

      // Mark all expired active quests
      const result = await this.prisma.userQuest.updateMany({
        where: {
          status: 'ACTIVE',
          endDate: { lt: now },
        },
        data: { status: 'EXPIRED' },
      });

      this.logger.log(`✅ Expired ${result.count} quests`);

      // Clean up old expired quests (> 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await this.prisma.userQuest.deleteMany({
        where: {
          status: 'EXPIRED',
          endDate: { lt: thirtyDaysAgo },
        },
      });

      // Invalidate quest caches
      await this.redis.delPattern('quest:user:*');
    } catch (error: any) {
      this.logger.error(`Quest reset failed: ${error.message}`);
    }
  }
}
