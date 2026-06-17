import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';

function getVnToday(): Date {
  const now = new Date();
  const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate()));
}

@Injectable()
export class GetStreakCalendarUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, startDate?: Date, endDate?: Date) {
    // Default: current month in VN time
    const vnNow = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    
    // Normalize start and end to VN midnight (stored as UTC midnight in DB)
    let start: Date;
    if (startDate) {
      const startVn = new Date(startDate.getTime() + 7 * 60 * 60 * 1000);
      start = new Date(Date.UTC(startVn.getUTCFullYear(), startVn.getUTCMonth(), startVn.getUTCDate()));
    } else {
      start = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), 1));
    }

    let end: Date;
    if (endDate) {
      const endVn = new Date(endDate.getTime() + 7 * 60 * 60 * 1000);
      end = new Date(Date.UTC(endVn.getUTCFullYear(), endVn.getUTCMonth(), endVn.getUTCDate()));
    } else {
      end = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth() + 1, 0));
    }

    const activities = await this.prisma.userDailyActivity.findMany({
      where: {
        userId,
        activityDate: { gte: start, lte: end },
      },
      orderBy: { activityDate: 'asc' },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true }
    });

    // We need user joined date at VN midnight to ignore prior dates
    const joinedAt = user?.createdAt ?? new Date();
    const joinedVn = new Date(joinedAt.getTime() + 7 * 60 * 60 * 1000);
    const joinedAtVnMidnight = new Date(
      Date.UTC(joinedVn.getUTCFullYear(), joinedVn.getUTCMonth(), joinedVn.getUTCDate())
    );

    // Build a set of studied dates for fast lookup
    const studiedMap = new Map(
      activities.map((a) => [a.activityDate.toISOString().split('T')[0], a]),
    );

    const streak = await this.prisma.streakData.findUnique({
      where: { userId },
    });
    
    const today = getVnToday();

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
      } else if (
        activity &&
        (activity.streakCount > 0 || activity.xpEarned > 0)
      ) {
        status = 'active';
      } else if (cursor < today) {
        if (cursor < joinedAtVnMidnight) {
          status = 'no_streak';
        } else {
          status = 'missed';
        }
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
        const nextActive =
          i < days.length - 1 && days[i + 1].status === 'active';
        days[i].isStreakStart = !prevActive;
        days[i].isStreakEnd = !nextActive;
      }
    }

    // Calculate summary matching mobile CalendarSummaryModel
    const totalDays = days.length;
    const activeDays = days.filter((d) => d.status === 'active').length;
    const frozenDays = days.filter((d) => d.status === 'frozen').length;
    const missedDays = days.filter((d) => d.status === 'missed').length;

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
