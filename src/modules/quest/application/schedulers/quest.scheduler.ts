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

      // Mark all expired active and completed quests
      const result = await this.prisma.userQuest.updateMany({
        where: {
          status: { in: ['ACTIVE', 'COMPLETED'] },
          endDate: { lt: now },
        },
        data: { status: 'EXPIRED' },
      });

      this.logger.log(`✅ Expired ${result.count} quests`);

      // Clean up ALL expired quests immediately
      await this.prisma.userQuest.deleteMany({
        where: {
          status: 'EXPIRED',
        },
      });

      // Invalidate quest caches
      await this.redis.delPattern('quest:user:*');
    } catch (error: any) {
      this.logger.error(`Quest reset failed: ${error.message}`);
    }
  }
}
