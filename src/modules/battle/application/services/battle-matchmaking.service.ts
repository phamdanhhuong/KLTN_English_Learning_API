import { Injectable, Inject, Logger } from '@nestjs/common';
import { BATTLE_TOKENS } from '../../domain/di/tokens';
import type { BattleRepository } from '../../domain/repositories/battle.repository.interface';
import { BattleGameService } from './battle-game.service';

const SEARCH_TIMEOUT = 20000; // 20 seconds before bot fallback

@Injectable()
export class BattleMatchmakingService {
  private readonly logger = new Logger(BattleMatchmakingService.name);

  // Track search start times per user
  private searchTimers = new Map<string, { timer: NodeJS.Timeout; startTime: number }>();

  constructor(
    @Inject(BATTLE_TOKENS.BATTLE_REPOSITORY)
    private readonly battleRepo: BattleRepository,
    private readonly gameService: BattleGameService,
  ) {}

  async findMatch(
    userId: string,
    onMatchFound: (matchData: any) => void,
    onSearching: (data: any) => void,
  ) {
    const tier = await this.battleRepo.getUserTier(userId);

    // Check if already in a match — abandon old match and start fresh
    const activeMatch = await this.battleRepo.getActiveMatch(userId);
    if (activeMatch) {
      const match = await this.battleRepo.findMatchById(activeMatch);
      if (match && match.status === 'IN_PROGRESS') {
        this.logger.log(`Abandoning old match ${activeMatch} for user ${userId}`);
        await this.battleRepo.updateMatch(activeMatch, { status: 'ABANDONED' });
        await this.battleRepo.removeActiveMatch(userId);

        // Also clean up opponent's active match tracking
        const oppId = match.player1Id === userId ? match.player2Id : match.player1Id;
        if (oppId && !match.isBot) {
          await this.battleRepo.removeActiveMatch(oppId);
        }
      }
    }

    // Try instant match (someone already waiting in same tier)
    const opponent = await this.battleRepo.findOpponentInQueue(tier, userId);
    if (opponent) {
      await this.battleRepo.removeFromQueue(opponent);
      const matchData = await this.createAndStartMatch(userId, opponent, tier);
      onMatchFound(matchData);
      return;
    }

    // Add to queue and start searching
    await this.battleRepo.addToQueue(userId, tier);
    onSearching({ tier, estimatedWait: 15 });

    // Start polling for opponents with progressive tier expansion
    const startTime = Date.now();
    const timer = setInterval(async () => {
      const elapsed = Date.now() - startTime;

      // Always try same tier first
      let opp = await this.battleRepo.findOpponentInQueue(tier, userId);

      // Progressive tier expansion based on elapsed time
      if (!opp) {
        let maxDiff = 0;
        if (elapsed > 15000) maxDiff = 3;       // 15-18s: ±3 ranks
        else if (elapsed > 10000) maxDiff = 2;   // 10-15s: ±2 ranks
        else if (elapsed > 5000) maxDiff = 1;    // 5-10s: ±1 rank

        if (maxDiff > 0) {
          opp = await this.battleRepo.findOpponentByMaxTierDiff(tier, userId, maxDiff);
        }
      }

      if (opp) {
        this.clearSearch(userId);
        await this.battleRepo.removeFromQueue(opp);
        await this.battleRepo.removeFromQueue(userId);
        const matchData = await this.createAndStartMatch(userId, opp, tier);
        onMatchFound(matchData);
        return;
      }

      // After 20s, match with bot
      if (elapsed >= SEARCH_TIMEOUT) {
        this.clearSearch(userId);
        await this.battleRepo.removeFromQueue(userId);
        const matchData = await this.createBotMatch(userId, tier);
        onMatchFound(matchData);
      }
    }, 2000);

    this.searchTimers.set(userId, { timer, startTime });
  }

  async cancelSearch(userId: string) {
    this.clearSearch(userId);
    await this.battleRepo.removeFromQueue(userId);
  }

  private clearSearch(userId: string) {
    const entry = this.searchTimers.get(userId);
    if (entry) {
      clearInterval(entry.timer);
      this.searchTimers.delete(userId);
    }
  }

  private async createAndStartMatch(player1Id: string, player2Id: string, tier: string) {
    const result = await this.gameService.createMatchWithRounds(player1Id, player2Id, tier, false);

    await this.battleRepo.setActiveMatch(player1Id, result.matchId);
    await this.battleRepo.setActiveMatch(player2Id, result.matchId);

    const [p1Info, p2Info] = await Promise.all([
      this.battleRepo.getUserBasicInfo(player1Id),
      this.battleRepo.getUserBasicInfo(player2Id),
    ]);

    const match = await this.battleRepo.findMatchById(result.matchId);
    const firstRound = match!.rounds[0];

    return {
      matchId: result.matchId,
      isBot: false,
      player1: p1Info,
      player2: p2Info,
      totalRounds: result.totalRounds,
      timePerRound: result.timePerRound,
      firstRound: this.gameService.getRoundQuestion(firstRound),
    };
  }

  private async createBotMatch(userId: string, tier: string) {
    const result = await this.gameService.createMatchWithRounds(userId, null, tier, true);

    // For bot matches, update status to IN_PROGRESS directly
    await this.battleRepo.updateMatch(result.matchId, {
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    });
    await this.battleRepo.setActiveMatch(userId, result.matchId);

    const userInfo = await this.battleRepo.getUserBasicInfo(userId);
    const botInfo = this.gameService.generateBotInfo();

    const match = await this.battleRepo.findMatchById(result.matchId);
    const firstRound = match!.rounds[0];

    return {
      matchId: result.matchId,
      isBot: true,
      player1: userInfo,
      player2: botInfo,
      totalRounds: result.totalRounds,
      timePerRound: result.timePerRound,
      firstRound: this.gameService.getRoundQuestion(firstRound),
    };
  }
}
