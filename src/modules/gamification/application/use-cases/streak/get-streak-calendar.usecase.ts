import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';

export interface CalendarDay {
  date: string; // 'YYYY-MM-DD'
  studied: boolean;
  streakCount: number;
  xpEarned: number;
  freezeUsed: boolean;
}

@Injectable()
export class GetStreakCalendarUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CalendarDay[]> {
    // Default: current month
    const now = new Date();
    const start = startDate ?? new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ?? new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const activities = await this.prisma.userDailyActivity.findMany({
      where: {
        userId,
        activityDate: { gte: start, lte: end },
      },
      orderBy: { activityDate: 'asc' },
    });

    // Build a set of studied dates for fast lookup
    const studiedMap = new Map(
      activities.map(a => [
        a.activityDate.toISOString().split('T')[0],
        a,
      ]),
    );

    // Fill calendar days
    const result: CalendarDay[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const key = cursor.toISOString().split('T')[0];
      const activity = studiedMap.get(key);
      result.push({
        date: key,
        studied: !!activity,
        streakCount: activity?.streakCount ?? 0,
        xpEarned: activity?.xpEarned ?? 0,
        freezeUsed: activity?.freezeUsed ?? false,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return result;
  }
}
