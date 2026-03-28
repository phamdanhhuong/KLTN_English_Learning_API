import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';
import type { ParticipantRepository } from '../../domain/repositories/participant.repository.interface';

@Injectable()
export class PrismaParticipantRepository implements ParticipantRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findUserActiveParticipation(userId: string, weekStart: Date) {
    return this.prisma.leagueParticipant.findFirst({
      where: {
        userId,
        group: {
          league: {
            weekStartDate: weekStart,
            status: 'ACTIVE',
          },
        },
      },
      include: { group: { include: { league: true } } },
    });
  }

  async create(groupId: string, userId: string) {
    return this.prisma.leagueParticipant.create({
      data: { groupId, userId },
    });
  }

  async updateXp(participantId: string, xpToAdd: number) {
    await this.prisma.leagueParticipant.update({
      where: { id: participantId },
      data: {
        weeklyXp: { increment: xpToAdd },
        lastXpUpdate: new Date(),
      },
    });
  }

  async getStandingsFromDB(groupId: string, currentUserId: string) {
    const participants = await this.prisma.leagueParticipant.findMany({
      where: { groupId },
      include: {
        user: {
          select: { id: true, username: true, fullName: true, profilePictureUrl: true },
        },
      },
      orderBy: { weeklyXp: 'desc' },
    });

    return participants.map((p, index) => {
      const rank = index + 1;
      return {
        rank,
        userId: p.userId,
        username: p.user?.username,
        fullName: p.user?.fullName,
        profilePictureUrl: p.user?.profilePictureUrl,
        weeklyXp: p.weeklyXp,
        isCurrentUser: p.userId === currentUserId,
        isPromoted: rank <= 10,
        isDemoted: participants.length >= 20 && rank > participants.length - 5,
      };
    });
  }

  // ─── Redis sorted set operations ───

  private getRedisKey(groupId: string): string {
    return `lb:${groupId}`;
  }

  async addToRedis(groupId: string, score: number, userId: string) {
    await this.redis.zAdd(this.getRedisKey(groupId), score, userId);
    await this.redis.expire(this.getRedisKey(groupId), 7 * 24 * 3600);
  }

  async incrXpRedis(groupId: string, xpToAdd: number, userId: string) {
    await this.redis.zIncrBy(this.getRedisKey(groupId), xpToAdd, userId);
  }

  async getStandingsFromRedis(groupId: string, currentUserId: string) {
    const redisKey = this.getRedisKey(groupId);
    const entries = await this.redis.zRevRangeWithScores(redisKey, 0, 29);
    if (entries.length === 0) return [];

    const userIds = entries.map((e) => e.value);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, fullName: true, profilePictureUrl: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return entries.map((entry, index) => {
      const user = userMap.get(entry.value);
      const rank = index + 1;
      return {
        rank,
        userId: entry.value,
        username: user?.username,
        fullName: user?.fullName,
        profilePictureUrl: user?.profilePictureUrl,
        weeklyXp: Math.floor(entry.score),
        isCurrentUser: entry.value === currentUserId,
        isPromoted: rank <= 10,
        isDemoted: entries.length >= 20 && rank > entries.length - 5,
      };
    });
  }

  async backfillRedis(groupId: string) {
    const participants = await this.prisma.leagueParticipant.findMany({
      where: { groupId },
    });

    const redisKey = this.getRedisKey(groupId);
    for (const p of participants) {
      await this.redis.zAdd(redisKey, p.weeklyXp, p.userId);
    }
    await this.redis.expire(redisKey, 7 * 24 * 3600);
  }

  async deleteRedisKey(groupId: string) {
    await this.redis.del(this.getRedisKey(groupId));
  }
}
