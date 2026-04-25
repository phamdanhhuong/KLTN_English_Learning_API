import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../../infrastructure/cache/redis.service';
import type { BattleRepository } from '../../domain/repositories/battle.repository.interface';

const QUEUE_PREFIX = 'battle:queue:';
const ACTIVE_PREFIX = 'battle:active:';

const USER_SELECT = {
  id: true, username: true, fullName: true,
  profilePictureUrl: true, currentLevel: true,
};

// Tier difficulty mapping — only quick exercise types for battle
const TIER_DIFFICULTY: Record<string, string[]> = {
  BRONZE: ['multiple_choice'],
  SILVER: ['multiple_choice', 'fill_blank'],
  GOLD: ['multiple_choice', 'fill_blank'],
  SAPPHIRE: ['multiple_choice', 'fill_blank'],
  RUBY: ['multiple_choice', 'fill_blank'],
  EMERALD: ['multiple_choice', 'fill_blank'],
  AMETHYST: ['multiple_choice', 'fill_blank'],
  PEARL: ['multiple_choice', 'fill_blank'],
  OBSIDIAN: ['multiple_choice', 'fill_blank'],
  DIAMOND: ['multiple_choice', 'fill_blank'],
};

const TIER_ORDER = ['BRONZE', 'SILVER', 'GOLD', 'SAPPHIRE', 'RUBY', 'EMERALD', 'AMETHYST', 'PEARL', 'OBSIDIAN', 'DIAMOND'];

@Injectable()
export class PrismaBattleRepository implements BattleRepository {
  private readonly logger = new Logger(PrismaBattleRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ─── Match CRUD ───

  async createMatch(player1Id: string, tier: string, isBot = false) {
    return this.prisma.battleMatch.create({
      data: {
        player1Id,
        tier,
        isBot,
        status: 'WAITING',
      },
    });
  }

  async findMatchById(matchId: string) {
    return this.prisma.battleMatch.findUnique({
      where: { id: matchId },
      include: {
        player1: { select: USER_SELECT },
        player2: { select: USER_SELECT },
        rounds: { orderBy: { roundNumber: 'asc' } },
      },
    });
  }

  async updateMatch(matchId: string, data: Record<string, any>) {
    return this.prisma.battleMatch.update({
      where: { id: matchId },
      data,
    });
  }

  async setMatchPlayer2(matchId: string, player2Id: string) {
    return this.prisma.battleMatch.update({
      where: { id: matchId },
      data: { player2Id, status: 'IN_PROGRESS', startedAt: new Date() },
    });
  }

  // ─── Rounds ───

  async createRounds(matchId: string, rounds: Array<{
    roundNumber: number;
    questionType: string;
    questionData: Record<string, any>;
  }>) {
    await this.prisma.battleRound.createMany({
      data: rounds.map((r) => ({
        matchId,
        roundNumber: r.roundNumber,
        questionType: r.questionType,
        questionData: r.questionData,
      })),
    });
  }

  async findRound(matchId: string, roundNumber: number) {
    return this.prisma.battleRound.findUnique({
      where: { matchId_roundNumber: { matchId, roundNumber } },
    });
  }

  async updateRoundAnswer(
    roundId: string,
    playerNum: 1 | 2,
    answer: string,
    timeMs: number,
    points: number,
  ) {
    const data = playerNum === 1
      ? { player1Answer: answer, player1TimeMs: timeMs, player1Points: points }
      : { player2Answer: answer, player2TimeMs: timeMs, player2Points: points };

    return this.prisma.battleRound.update({
      where: { id: roundId },
      data,
    });
  }

  async getMatchRounds(matchId: string) {
    return this.prisma.battleRound.findMany({
      where: { matchId },
      orderBy: { roundNumber: 'asc' },
    });
  }

  // ─── History & Stats ───

  async getUserMatches(userId: string, limit: number, offset: number) {
    return this.prisma.battleMatch.findMany({
      where: {
        status: 'COMPLETED',
        OR: [{ player1Id: userId }, { player2Id: userId }],
      },
      include: {
        player1: { select: USER_SELECT },
        player2: { select: USER_SELECT },
      },
      orderBy: { completedAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getUserStats(userId: string) {
    const matches = await this.prisma.battleMatch.findMany({
      where: {
        status: 'COMPLETED',
        OR: [{ player1Id: userId }, { player2Id: userId }],
      },
      select: { winnerId: true, player1Id: true, player2Id: true, completedAt: true },
      orderBy: { completedAt: 'desc' },
    });

    let wins = 0, losses = 0, draws = 0, currentStreak = 0, bestStreak = 0;
    let streakActive = true;

    for (const m of matches) {
      if (m.winnerId === null) {
        draws++;
        streakActive = false;
      } else if (m.winnerId === userId) {
        wins++;
        if (streakActive) currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        losses++;
        streakActive = false;
      }
    }
    bestStreak = Math.max(bestStreak, currentStreak);

    return {
      totalMatches: matches.length,
      wins,
      losses,
      draws,
      winStreak: currentStreak,
      bestWinStreak: bestStreak,
    };
  }

  async getRecentWinStreak(userId: string): Promise<number> {
    const recent = await this.prisma.battleMatch.findMany({
      where: {
        status: 'COMPLETED',
        OR: [{ player1Id: userId }, { player2Id: userId }],
      },
      select: { winnerId: true },
      orderBy: { completedAt: 'desc' },
      take: 20,
    });

    let streak = 0;
    for (const m of recent) {
      if (m.winnerId === userId) streak++;
      else break;
    }
    return streak;
  }

  // ─── Queue (Redis) ───

  async addToQueue(userId: string, tier: string) {
    await this.redis.set(`${QUEUE_PREFIX}${tier}:${userId}`, Date.now().toString(), 120);
  }

  async removeFromQueue(userId: string) {
    for (const tier of TIER_ORDER) {
      await this.redis.del(`${QUEUE_PREFIX}${tier}:${userId}`);
    }
  }

  async findOpponentInQueue(tier: string, excludeUserId: string) {
    const keys = await this.redis.keys(`${QUEUE_PREFIX}${tier}:*`);
    for (const key of keys) {
      const uid = key.split(':').pop()!;
      if (uid !== excludeUserId) {
        return uid;
      }
    }
    return null;
  }

  async findOpponentExpandedTier(tier: string, excludeUserId: string) {
    const idx = TIER_ORDER.indexOf(tier);
    const neighbors = [
      ...(idx > 0 ? [TIER_ORDER[idx - 1]] : []),
      ...(idx < TIER_ORDER.length - 1 ? [TIER_ORDER[idx + 1]] : []),
    ];
    for (const t of neighbors) {
      const opponent = await this.findOpponentInQueue(t, excludeUserId);
      if (opponent) return opponent;
    }
    return null;
  }

  async getQueueSize(tier: string) {
    const keys = await this.redis.keys(`${QUEUE_PREFIX}${tier}:*`);
    return keys.length;
  }

  // ─── Active match tracking ───

  async setActiveMatch(userId: string, matchId: string) {
    await this.redis.set(`${ACTIVE_PREFIX}${userId}`, matchId, 600);
  }

  async getActiveMatch(userId: string) {
    return this.redis.get(`${ACTIVE_PREFIX}${userId}`);
  }

  async removeActiveMatch(userId: string) {
    await this.redis.del(`${ACTIVE_PREFIX}${userId}`);
  }

  // ─── Exercise questions ───

  async getRandomExercises(tier: string, count: number) {
    const types = TIER_DIFFICULTY[tier] || TIER_DIFFICULTY.BRONZE;

    const exercises = await this.prisma.exercise.findMany({
      where: {
        exerciseType: { in: types as any },
      },
      select: {
        id: true,
        exerciseType: true,
        prompt: true,
        meta: true,
      },
      take: count * 3,
    });

    // Shuffle and pick
    const shuffled = exercises.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map((ex) => this.mapExerciseToBattleQuestion(ex)).filter(Boolean);
  }

  private mapExerciseToBattleQuestion(ex: {
    id: string;
    exerciseType: any;
    prompt: string | null;
    meta: any;
  }) {
    const meta = (ex.meta as any) || {};
    const type = ex.exerciseType;

    switch (type) {
      case 'multiple_choice': {
        // meta: { question, options: [{text, order}], correctOrder: number[] }
        const opts = (meta.options || []) as Array<{ text: string; order: number }>;
        const optionTexts = opts.sort((a: any, b: any) => a.order - b.order).map((o: any) => o.text);
        const correctOrders = meta.correctOrder || [];
        const correctOpt = opts.find((o: any) => correctOrders.includes(o.order));
        return {
          id: ex.id,
          type,
          exerciseType: type,
          prompt: meta.question || ex.prompt || '',
          options: optionTexts,
          correctAnswer: correctOpt?.text || optionTexts[0] || '',
          audioUrl: null,
          rawMeta: meta, // full original meta for frontend exercise widget
        };
      }

      case 'fill_blank': {
        // meta: { sentences: [{text, correctAnswer, options?}], context? }
        const sentences = meta.sentences || [];
        const sentence = sentences[0] || {};
        const baseOptions = sentence.options || [];
        let options = [...baseOptions];
        if (sentence.correctAnswer && !options.includes(sentence.correctAnswer)) {
          options.push(sentence.correctAnswer);
        }
        if (options.length < 2) {
          options = [sentence.correctAnswer || '', '___'];
        }
        options = options.sort(() => Math.random() - 0.5);
        return {
          id: ex.id,
          type,
          exerciseType: type,
          prompt: sentence.text || ex.prompt || 'Điền vào chỗ trống',
          options,
          correctAnswer: sentence.correctAnswer || '',
          audioUrl: null,
          rawMeta: meta,
        };
      }

      default:
        return null;
    }
  }

  // ─── User info ───

  async getUserBasicInfo(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });
  }

  async getUserTier(userId: string): Promise<string> {
    const tierData = await this.prisma.userLeagueTier.findUnique({
      where: { userId },
    });
    return tierData?.currentTier || 'BRONZE';
  }
}
