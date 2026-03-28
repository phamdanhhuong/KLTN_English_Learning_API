import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { LEADERBOARD_TOKENS } from '../../domain/di/tokens';
import type { LeagueRepository } from '../../domain/repositories/league.repository.interface';
import type { ParticipantRepository } from '../../domain/repositories/participant.repository.interface';
import type { UserTierRepository } from '../../domain/repositories/user-tier.repository.interface';
import type { LeagueHistoryRepository } from '../../domain/repositories/league-history.repository.interface';
import { FeedService } from '../../../feed/application/services/feed.service';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    @Inject(LEADERBOARD_TOKENS.LEAGUE_REPOSITORY)
    private readonly leagueRepo: LeagueRepository,
    @Inject(LEADERBOARD_TOKENS.PARTICIPANT_REPOSITORY)
    private readonly participantRepo: ParticipantRepository,
    @Inject(LEADERBOARD_TOKENS.USER_TIER_REPOSITORY)
    private readonly userTierRepo: UserTierRepository,
    @Inject(LEADERBOARD_TOKENS.LEAGUE_HISTORY_REPOSITORY)
    private readonly historyRepo: LeagueHistoryRepository,
    private readonly feedService: FeedService,
  ) {}

  // ─── Core: Join League ───

  async joinLeague(userId: string) {
    const weekStart = this.getCurrentWeekStart();
    const weekEnd = this.getCurrentWeekEnd();

    // Check if already in a league this week
    const existing = await this.participantRepo.findUserActiveParticipation(userId, weekStart);
    if (existing) return existing;

    // Get or create user tier
    const userTier = await this.userTierRepo.getOrCreate(userId);

    // Get or create league for this tier & week
    let league = await this.leagueRepo.findByTierAndWeek(userTier.currentTier, weekStart);
    if (!league) {
      league = await this.leagueRepo.create(userTier.currentTier, weekStart, weekEnd);
    }

    // Find available group or create new one
    let group = await this.leagueRepo.findAvailableGroup(league.id);
    if (!group) {
      const groupCount = await this.leagueRepo.countGroups(league.id);
      group = await this.leagueRepo.createGroup(league.id, groupCount + 1);
    }

    // Add user to group
    const participant = await this.participantRepo.create(group.id, userId);

    // Update group count
    await this.leagueRepo.incrementGroupParticipant(group.id, group.participantCount, group.maxParticipants);

    // Update user tier with current group
    await this.userTierRepo.updateCurrentGroup(userId, group.id);

    // Add to Redis sorted set
    await this.participantRepo.addToRedis(group.id, 0, userId);

    return {
      id: participant.id,
      tier: userTier.currentTier,
      groupNumber: group.groupNumber,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      weeklyXp: 0,
      joined: true,
    };
  }

  // ─── Core: Update XP (DB + Redis) ───

  async updateUserXp(userId: string, xpToAdd: number) {
    const weekStart = this.getCurrentWeekStart();
    let participation = await this.participantRepo.findUserActiveParticipation(userId, weekStart);

    if (!participation) {
      const joinResult = await this.joinLeague(userId);
      participation = await this.participantRepo.findUserActiveParticipation(userId, weekStart);
      if (!participation) return;
    }

    // Update DB
    await this.participantRepo.updateXp(participation.id, xpToAdd);

    // Update Redis sorted set — O(log N)
    await this.participantRepo.incrXpRedis(participation.groupId, xpToAdd, userId);
  }

  // ─── Core: Get Standings ───

  async getLeaderboard(userId: string) {
    const weekStart = this.getCurrentWeekStart();
    const participation = await this.participantRepo.findUserActiveParticipation(userId, weekStart);

    if (!participation) {
      throw new NotFoundException('Not in any league this week. Call POST /leaderboard/join first.');
    }

    const groupId = participation.groupId;

    // Try Redis first
    let standings = await this.participantRepo.getStandingsFromRedis(groupId, userId);

    if (standings.length === 0) {
      // Fallback to DB
      standings = await this.participantRepo.getStandingsFromDB(groupId, userId);
      // Backfill Redis
      await this.participantRepo.backfillRedis(groupId);
    }

    // Get league info
    const group = await this.leagueRepo.findGroupWithLeague(groupId);

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
    return this.userTierRepo.getOrCreate(userId);
  }

  // ─── Core: Get History ───

  async getHistory(userId: string) {
    return this.historyRepo.findByUser(userId);
  }

  // ─── Weekly Rotation ───

  async processWeeklyRotation() {
    const previousWeekStart = new Date(this.getCurrentWeekStart());
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);

    const leagues = await this.leagueRepo.findActiveLeaguesByWeek(previousWeekStart);

    for (const league of leagues) {
      for (const group of league.groups) {
        await this.processGroupRotation(group, league.tier);
      }

      await this.leagueRepo.archiveLeague(league.id);
      await this.participantRepo.deleteRedisKey(league.id);
    }
  }

  // ─── Private helpers ───

  private async processGroupRotation(group: any, tier: string) {
    let standings = await this.participantRepo.getStandingsFromRedis(group.id, '');
    if (standings.length === 0) {
      standings = await this.participantRepo.getStandingsFromDB(group.id, '');
    }

    const totalParticipants = standings.length;

    for (const standing of standings) {
      const rank = standing.rank;
      const userId = standing.userId;
      const weeklyXp = standing.weeklyXp;
      let outcome = 'MAINTAINED';

      if (this.shouldPromote(rank)) {
        outcome = 'PROMOTED';
        const tierResult = await this.userTierRepo.changeTier(userId, 'up');

        // Feed auto-create: LEAGUE_PROMOTION
        this.feedService.autoCreatePost(userId, 'LEAGUE_PROMOTION', {
          oldTier: tierResult.oldTier,
          newTier: tierResult.newTier,
        }).catch(() => {});
      } else if (this.shouldDemote(rank, totalParticipants)) {
        outcome = 'DEMOTED';
        await this.userTierRepo.changeTier(userId, 'down');
      }

      // Feed auto-create: LEAGUE_TOP_3
      if (rank <= 3) {
        this.feedService.autoCreatePost(userId, 'LEAGUE_TOP_3', {
          tier,
          rank,
        }).catch(() => {});
      }

      await this.historyRepo.create({
        userId,
        tier,
        weekStartDate: group.league?.weekStartDate ?? new Date(),
        weeklyXp: Math.floor(weeklyXp),
        rank,
        outcome,
      });
    }
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
