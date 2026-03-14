import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';

@Injectable()
export class GetStreakCalendarUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
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

    const streak = await this.prisma.streakData.findUnique({ where: { userId } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fill calendar days matching mobile CalendarDayModel
    const days: {
      date: string;
      status: string;
      streakCount: number;
      isStreakStart: boolean;
      isStreakEnd: boolean;
      freezeUsed: boolean;
    }[] = [];

    const cursor = new Date(start);
    while (cursor <= end) {
      const key = cursor.toISOString().split('T')[0];
      const activity = studiedMap.get(key);
      const isFuture = cursor > today;

      let status: string;
      if (isFuture) {
        status = 'future';
      } else if (activity?.freezeUsed) {
        status = 'frozen';
      } else if (activity && (activity.streakCount > 0 || activity.xpEarned > 0)) {
        status = 'active';
      } else if (cursor < today) {
        status = 'missed';
      } else {
        status = 'no_streak';
      }

      days.push({
        date: key,
        status,
        streakCount: activity?.streakCount ?? 0,
        isStreakStart: false,
        isStreakEnd: false,
        freezeUsed: activity?.freezeUsed ?? false,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    // Compute isStreakStart / isStreakEnd
    for (let i = 0; i < days.length; i++) {
      if (days[i].status === 'active') {
        const prevActive = i > 0 && days[i - 1].status === 'active';
        const nextActive = i < days.length - 1 && days[i + 1].status === 'active';
        days[i].isStreakStart = !prevActive;
        days[i].isStreakEnd = !nextActive;
      }
    }

    // Calculate summary matching mobile CalendarSummaryModel
    const totalDays = days.length;
    const activeDays = days.filter(d => d.status === 'active').length;
    const frozenDays = days.filter(d => d.status === 'frozen').length;
    const missedDays = days.filter(d => d.status === 'missed').length;

    // Longest streak in the displayed range
    let longestStreakInRange = 0;
    let currentRun = 0;
    for (const d of days) {
      if (d.status === 'active' || d.status === 'frozen') {
        currentRun++;
        longestStreakInRange = Math.max(longestStreakInRange, currentRun);
      } else {
        currentRun = 0;
      }
    }

    return {
      userId,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      days,
      summary: {
        totalDays,
        activeDays,
        frozenDays,
        missedDays,
        currentStreak: streak?.currentStreak ?? 0,
        longestStreakInRange,
      },
      success: true,
    };
  }
}
