import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

function getVnToday(): Date {
  const now = new Date();
  const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate()));
}

@Injectable()
export class StreakScheduler {
  private readonly logger = new Logger(StreakScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Chạy lúc 00:01 VN time (17:01 UTC hôm trước)
   * Quét tất cả user bỏ học qua ngày → reset streak hoặc dùng freeze
   */
  @Cron('1 17 * * *', { name: 'streak-expiration-check', timeZone: 'UTC' })
  async handleStreakExpiration() {
    this.logger.log('⏰ Streak expiration check started...');
    const today = getVnToday();
    const yesterday = new Date(today.getTime() - 86400000);

    try {
      // Lấy tất cả streak chưa học hôm qua (lastStudyDate < yesterday)
      const expiredStreaks = await this.prisma.streakData.findMany({
        where: {
          currentStreak: { gt: 0 },
          OR: [
            { lastStudyDate: { lt: yesterday } },
            { lastStudyDate: null },
          ],
        },
        select: { id: true, userId: true, currentStreak: true, longestStreak: true,
          lastStudyDate: true, freezeCount: true },
      });

      let broken = 0, frozen = 0, skipped = 0;
      const errors: string[] = [];

      for (const streak of expiredStreaks) {
        try {
          await this.prisma.$transaction(async (tx) => {
            if (streak.freezeCount > 0) {
              // Auto-use freeze
              await tx.streakData.update({
                where: { id: streak.id },
                data: { freezeCount: { decrement: 1 } },
              });
              // Log freeze day trong daily activity
              await tx.userDailyActivity.upsert({
                where: { userId_activityDate: { userId: streak.userId, activityDate: yesterday } },
                update: { freezeUsed: true },
                create: { userId: streak.userId, activityDate: yesterday, freezeUsed: true,
                  streakCount: streak.currentStreak },
              });
              frozen++;
            } else {
              // Break streak
              if (streak.currentStreak >= 3) {
                await tx.streakHistory.create({
                  data: {
                    streakDataId: streak.id,
                    streakLength: streak.currentStreak,
                    startDate: new Date(yesterday.getTime() - (streak.currentStreak - 1) * 86400000),
                    endDate: streak.lastStudyDate ?? yesterday,
                    endReason: 'expired',
                  },
                });
              }
              await tx.streakData.update({
                where: { id: streak.id },
                data: { currentStreak: 0 },
              });
              broken++;
            }
          });
        } catch (err: any) {
          errors.push(`userId=${streak.userId}: ${err.message}`);
        }
      }

      this.logger.log(
        `✅ Streak check done — ${expiredStreaks.length} checked, ` +
        `${broken} broken, ${frozen} frozen, ${skipped} skipped`,
      );
      if (errors.length) this.logger.warn(`⚠️ ${errors.length} errors: ${errors.join('; ')}`);
    } catch (err: any) {
      this.logger.error('❌ Streak scheduler failed', err.stack);
    }
  }
}
