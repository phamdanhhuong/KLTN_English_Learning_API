import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import type { LeagueHistoryRepository } from '../../domain/repositories/league-history.repository.interface';

@Injectable()
export class PrismaLeagueHistoryRepository implements LeagueHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    tier: string;
    weekStartDate: Date;
    weeklyXp: number;
    rank: number;
    outcome: string;
  }) {
    await this.prisma.leagueHistory.create({
      data: {
        userId: data.userId,
        tier: data.tier as any,
        weekStartDate: data.weekStartDate,
        weeklyXp: data.weeklyXp,
        rank: data.rank,
        outcome: data.outcome,
      },
    });
  }

  async findByUser(userId: string, limit = 20) {
    return this.prisma.leagueHistory.findMany({
      where: { userId },
      orderBy: { weekStartDate: 'desc' },
      take: limit,
    });
  }
}
