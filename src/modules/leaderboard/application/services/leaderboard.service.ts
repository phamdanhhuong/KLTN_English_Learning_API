import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ─── Core: Join League ───

  async joinLeague(userId: string) {
    const weekStart = this.getCurrentWeekStart();
    const weekEnd = this.getCurrentWeekEnd();

    // Check if already in a league this week
    const existing = await this.findUserActiveParticipation(userId, weekStart);
    if (existing) return existing;

    // Get or create user tier
    let userTier = await this.prisma.userLeagueTier.findUnique({ where: { userId } });
    if (!userTier) {
      userTier = await this.prisma.userLeagueTier.create({
        data: { userId, currentTier: 'BRONZE', highestTier: 'BRONZE' },
      });
    }

    // Get or create league for this tier & week
    let league = await this.prisma.league.findUnique({
      where: { tier_weekStartDate: { tier: userTier.currentTier, weekStartDate: weekStart } },
    });
    if (!league) {
      league = await this.prisma.league.create({
        data: { tier: userTier.currentTier, weekStartDate: weekStart, weekEndDate: weekEnd },
      });
    }

    // Find available group or create new one
    let group = await this.prisma.leagueGroup.findFirst({
      where: { leagueId: league.id, isFull: false },
      orderBy: { groupNumber: 'asc' },
    });

    if (!group) {
      const groupCount = await this.prisma.leagueGroup.count({ where: { leagueId: league.id } });
      group = await this.prisma.leagueGroup.create({
        data: { leagueId: league.id, groupNumber: groupCount + 1 },
      });
    }

    // Add user to group
    const participant = await this.prisma.leagueParticipant.create({
      data: { groupId: group.id, userId },
    });

    // Update group count
    await this.prisma.leagueGroup.update({
      where: { id: group.id },
      data: {
        participantCount: { increment: 1 },
        isFull: group.participantCount + 1 >= group.maxParticipants,
      },
    });

    // Update user tier with current group
    await this.prisma.userLeagueTier.update({
      where: { userId },
      data: { currentGroupId: group.id },
    });

    // Add to Redis sorted set
    await this.redis.zAdd(this.getRedisKey(group.id), 0, userId);
    await this.redis.expire(this.getRedisKey(group.id), 7 * 24 * 3600); // 7 days

    return participant;
  }

  // ─── Core: Update XP (DB + Redis) ───

  async updateUserXp(userId: string, xpToAdd: number) {
    const weekStart = this.getCurrentWeekStart();
    let participation = await this.findUserActiveParticipation(userId, weekStart);

    if (!participation) {
      // Auto-join league
      const joinResult = await this.joinLeague(userId);
      participation = await this.prisma.leagueParticipant.findUnique({
        where: { id: joinResult.id },
        include: { group: { include: { league: true } } },
      });
      if (!participation) return;
    }

    // Update DB
    await this.prisma.leagueParticipant.update({
      where: { id: participation.id },
      data: {
        weeklyXp: { increment: xpToAdd },
        lastXpUpdate: new Date(),
      },
    });

    // Update Redis sorted set — O(log N)
    await this.redis.zIncrBy(this.getRedisKey(participation.groupId), xpToAdd, userId);
  }

  // ─── Core: Get Standings ───

  async getLeaderboard(userId: string) {
    const weekStart = this.getCurrentWeekStart();
    const participation = await this.findUserActiveParticipation(userId, weekStart);

    if (!participation) {
      throw new NotFoundException('Not in any league this week. Call POST /leaderboard/join first.');
    }

    const groupId = participation.groupId;
    const redisKey = this.getRedisKey(groupId);

    // Try Redis first
    let standings = await this.getStandingsFromRedis(redisKey, userId, groupId);

    if (standings.length === 0) {
      // Fallback to DB
      standings = await this.getStandingsFromDB(groupId, userId);
      // Backfill Redis
      await this.backfillRedis(groupId);
    }

    // Get league info
    const group = await this.prisma.leagueGroup.findUnique({
      where: { id: groupId },
      include: { league: true },
    });

    return {
      tier: group?.league?.tier,
      groupNumber: group?.groupNumber,
      weekStartDate: group?.league?.weekStartDate,
      weekEndDate: group?.league?.weekEndDate,
      standings,
      userRank: standings.find((s: any) => s.isCurrentUser)?.rank,
      totalParticipants: standings.length,
    };
  }

  // ─── Core: Get User Tier ───

  async getUserTier(userId: string) {
    const cached = await this.redis.get(`lb:tier:${userId}`);
    if (cached) return JSON.parse(cached);

    let tier = await this.prisma.userLeagueTier.findUnique({
      where: { userId },
    });

    if (!tier) {
      tier = await this.prisma.userLeagueTier.create({
        data: { userId, currentTier: 'BRONZE', highestTier: 'BRONZE' },
      });
    }

    await this.redis.set(`lb:tier:${userId}`, JSON.stringify(tier), 86400); // 1 day
    return tier;
  }

  // ─── Core: Get History ───

  async getHistory(userId: string) {
    return this.prisma.leagueHistory.findMany({
      where: { userId },
      orderBy: { weekStartDate: 'desc' },
      take: 20,
    });
  }

  // ─── Weekly Rotation ───

  async processWeeklyRotation() {
    const previousWeekStart = new Date(this.getCurrentWeekStart());
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);

    const leagues = await this.prisma.league.findMany({
      where: { status: 'ACTIVE', weekStartDate: previousWeekStart },
      include: { groups: { include: { participants: true } } },
    });

    for (const league of leagues) {
      for (const group of league.groups) {
        await this.processGroupRotation(group, league.tier);
      }

      await this.prisma.league.update({
        where: { id: league.id },
        data: { status: 'ARCHIVED' },
      });

      // Cleanup Redis
      await this.redis.del(this.getRedisKey(league.id));
    }
  }

  // ─── Private helpers ───

  private async processGroupRotation(group: any, tier: string) {
    // Get final standings from Redis or DB
    const redisKey = this.getRedisKey(group.id);
    let rankedParticipants = await this.redis.zRevRangeWithScores(redisKey, 0, -1);

    if (rankedParticipants.length === 0) {
      // Fallback to DB
      const dbParticipants = await this.prisma.leagueParticipant.findMany({
        where: { groupId: group.id },
        orderBy: { weeklyXp: 'desc' },
      });
      rankedParticipants = dbParticipants.map((p) => ({ value: p.userId, score: p.weeklyXp }));
    }

    const totalParticipants = rankedParticipants.length;

    for (let i = 0; i < rankedParticipants.length; i++) {
      const rank = i + 1;
      const userId = rankedParticipants[i].value;
      const weeklyXp = rankedParticipants[i].score;
      let outcome = 'MAINTAINED';

      if (this.shouldPromote(rank)) {
        outcome = 'PROMOTED';
        await this.changeTier(userId, 'up');
      } else if (this.shouldDemote(rank, totalParticipants)) {
        outcome = 'DEMOTED';
        await this.changeTier(userId, 'down');
      }

      // Record history
      await this.prisma.leagueHistory.create({
        data: {
          userId,
          tier: tier as any,
          weekStartDate: group.league?.weekStartDate ?? new Date(),
          weeklyXp: Math.floor(weeklyXp),
          rank,
          outcome,
        },
      });
    }
  }

  private async changeTier(userId: string, direction: 'up' | 'down') {
    const tierOrder = [
      'BRONZE', 'SILVER', 'GOLD', 'SAPPHIRE', 'RUBY',
      'EMERALD', 'AMETHYST', 'PEARL', 'OBSIDIAN', 'DIAMOND',
    ];

    const userTier = await this.prisma.userLeagueTier.findUnique({ where: { userId } });
    if (!userTier) return;

    const currentIndex = tierOrder.indexOf(userTier.currentTier);
    let newIndex = direction === 'up' ? currentIndex + 1 : currentIndex - 1;
    newIndex = Math.max(0, Math.min(newIndex, tierOrder.length - 1));

    const newTier = tierOrder[newIndex] as any;
    const updates: any = {
      currentTier: newTier,
      currentGroupId: null,
    };

    if (direction === 'up') {
      updates.totalPromotions = { increment: 1 };
      if (newIndex > tierOrder.indexOf(userTier.highestTier)) {
        updates.highestTier = newTier;
      }
    } else {
      updates.totalDemotions = { increment: 1 };
    }

    await this.prisma.userLeagueTier.update({
      where: { userId },
      data: updates,
    });

    // Invalidate tier cache
    await this.redis.del(`lb:tier:${userId}`);
  }

  private async findUserActiveParticipation(userId: string, weekStart: Date) {
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

  private async getStandingsFromRedis(redisKey: string, currentUserId: string, groupId: string) {
    const entries = await this.redis.zRevRangeWithScores(redisKey, 0, 29);
    if (entries.length === 0) return [];

    // Fetch user details
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
        isPromoted: this.shouldPromote(rank),
        isDemoted: this.shouldDemote(rank, entries.length),
      };
    });
  }

  private async getStandingsFromDB(groupId: string, currentUserId: string) {
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
        isPromoted: this.shouldPromote(rank),
        isDemoted: this.shouldDemote(rank, participants.length),
      };
    });
  }

  private async backfillRedis(groupId: string) {
    const participants = await this.prisma.leagueParticipant.findMany({
      where: { groupId },
    });

    const redisKey = this.getRedisKey(groupId);
    for (const p of participants) {
      await this.redis.zAdd(redisKey, p.weeklyXp, p.userId);
    }
    await this.redis.expire(redisKey, 7 * 24 * 3600);
  }

  private getRedisKey(groupId: string): string {
    return `lb:${groupId}`;
  }

  shouldPromote(rank: number): boolean {
    return rank <= 10;
  }

  shouldDemote(rank: number, totalParticipants: number): boolean {
    if (totalParticipants < 20) return false;
    return rank > totalParticipants - 5;
  }

  getCurrentWeekStart(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  getCurrentWeekEnd(): Date {
    const weekStart = this.getCurrentWeekStart();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  }
}
