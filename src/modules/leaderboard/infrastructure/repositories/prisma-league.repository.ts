import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import type { LeagueRepository } from '../../domain/repositories/league.repository.interface';

@Injectable()
export class PrismaLeagueRepository implements LeagueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTierAndWeek(tier: string, weekStartDate: Date) {
    return this.prisma.league.findUnique({
      where: { tier_weekStartDate: { tier: tier as any, weekStartDate } },
    });
  }

  async create(tier: string, weekStartDate: Date, weekEndDate: Date) {
    return this.prisma.league.create({
      data: { tier: tier as any, weekStartDate, weekEndDate },
    });
  }

  async findAvailableGroup(leagueId: string) {
    return this.prisma.leagueGroup.findFirst({
      where: { leagueId, isFull: false },
      orderBy: { groupNumber: 'asc' },
    });
  }

  async createGroup(leagueId: string, groupNumber: number) {
    return this.prisma.leagueGroup.create({
      data: { leagueId, groupNumber },
    });
  }

  async countGroups(leagueId: string) {
    return this.prisma.leagueGroup.count({ where: { leagueId } });
  }

  async incrementGroupParticipant(groupId: string, currentCount: number, maxParticipants: number) {
    await this.prisma.leagueGroup.update({
      where: { id: groupId },
      data: {
        participantCount: { increment: 1 },
        isFull: currentCount + 1 >= maxParticipants,
      },
    });
  }

  async findGroupWithLeague(groupId: string) {
    return this.prisma.leagueGroup.findUnique({
      where: { id: groupId },
      include: { league: true },
    });
  }

  async findActiveLeaguesByWeek(weekStartDate: Date) {
    return this.prisma.league.findMany({
      where: { status: 'ACTIVE', weekStartDate },
      include: { groups: { include: { participants: true } } },
    });
  }

  async archiveLeague(leagueId: string) {
    await this.prisma.league.update({
      where: { id: leagueId },
      data: { status: 'ARCHIVED' },
    });
  }
}
