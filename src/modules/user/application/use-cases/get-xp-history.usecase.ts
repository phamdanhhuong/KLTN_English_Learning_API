import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

export interface DailyXpEntry {
  date: string;
  xpEarned: number;
  lessonsCount: number;
}

@Injectable()
export class GetXpHistoryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, days = 7): Promise<DailyXpEntry[]> {
    const vnNow = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    const today = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate()));
    const start = new Date(today.getTime() - (days - 1) * 86400000);

    const activities = await this.prisma.userDailyActivity.findMany({
      where: { userId, activityDate: { gte: start, lte: today } },
      select: { activityDate: true, xpEarned: true, lessonsCount: true },
      orderBy: { activityDate: 'asc' },
    });

    const map = new Map(activities.map(a => [a.activityDate.toISOString().split('T')[0], a]));

    // Fill all days including zeros
    const result: DailyXpEntry[] = [];
    const cursor = new Date(start);
    while (cursor <= today) {
      const key = cursor.toISOString().split('T')[0];
      const a = map.get(key);
      result.push({ date: key, xpEarned: a?.xpEarned ?? 0, lessonsCount: a?.lessonsCount ?? 0 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return result;
  }
}
