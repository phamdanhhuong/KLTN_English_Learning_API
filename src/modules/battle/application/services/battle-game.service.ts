import { Injectable, Inject, Logger } from '@nestjs/common';
import { BATTLE_TOKENS } from '../../domain/di/tokens';
import type { BattleRepository } from '../../domain/repositories/battle.repository.interface';
import { FeedService } from '../../../feed/application/services/feed.service';
import { LeaderboardService } from '../../../leaderboard/application/services/leaderboard.service';

const BOT_NAMES = [
  'EnglishMaster', 'QuizKing', 'WordNinja', 'VocabHero',
  'GrammarPro', 'SpellWizard', 'LexiconLord', 'PhraseMaster',
];

const TOTAL_ROUNDS = 5;
const ROUND_TIME_LIMIT = 15000; // 15 seconds
const BASE_POINTS = 100;

@Injectable()
export class BattleGameService {
  private readonly logger = new Logger(BattleGameService.name);

  constructor(
    @Inject(BATTLE_TOKENS.BATTLE_REPOSITORY)
    private readonly battleRepo: BattleRepository,
    private readonly feedService: FeedService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  // ─── Create match with rounds ───

  async createMatchWithRounds(
    player1Id: string,
    player2Id: string | null,
    tier: string,
    isBot: boolean,
  ) {
    const match = await this.battleRepo.createMatch(player1Id, tier, isBot);

    if (player2Id) {
      await this.battleRepo.setMatchPlayer2(match.id, player2Id);
    }

    // Generate questions from exercise pool
    const exercises = await this.battleRepo.getRandomExercises(tier, TOTAL_ROUNDS);

    const rounds = exercises.map((ex: any, i: number) => ({
      roundNumber: i + 1,
      questionType: ex.type,
      questionData: {
        prompt: ex.prompt,
        options: ex.options,
        correctAnswer: ex.correctAnswer,
        audioUrl: ex.audioUrl || null,
        exerciseId: ex.id,
      },
    }));

    // Fill remaining rounds if not enough exercises
    while (rounds.length < TOTAL_ROUNDS) {
      rounds.push({
        roundNumber: rounds.length + 1,
        questionType: 'multiple_choice',
        questionData: {
          prompt: `What is the correct translation?`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 'Option A',
          audioUrl: null,
          exerciseId: null,
        },
      });
    }

    await this.battleRepo.createRounds(match.id, rounds);

    return {
      matchId: match.id,
      totalRounds: TOTAL_ROUNDS,
      timePerRound: ROUND_TIME_LIMIT,
    };
  }

  // ─── Submit answer & calculate points ───

  async submitAnswer(
    matchId: string,
    userId: string,
    roundNumber: number,
    answer: string,
    timeMs: number,
  ) {
    const match = await this.battleRepo.findMatchById(matchId);
    if (!match || match.status !== 'IN_PROGRESS') {
      throw new Error('Match not found or not in progress');
    }

    const round = await this.battleRepo.findRound(matchId, roundNumber);
    if (!round) throw new Error('Round not found');

    const isPlayer1 = match.player1Id === userId;
    const playerNum: 1 | 2 = isPlayer1 ? 1 : 2;

    // Check if already answered
    if (playerNum === 1 && round.player1Answer !== null) return { alreadyAnswered: true };
    if (playerNum === 2 && round.player2Answer !== null) return { alreadyAnswered: true };

    // Calculate points
    const correctAnswer = (round.questionData as any).correctAnswer;
    const isCorrect = answer === correctAnswer;
    let points = 0;

    if (isCorrect) {
      const speedBonus = Math.max(0, Math.floor((ROUND_TIME_LIMIT - timeMs) / 1000) * 10);
      points = BASE_POINTS + speedBonus;
    }

    await this.battleRepo.updateRoundAnswer(round.id, playerNum, answer, timeMs, points);

    // Update match score
    const scoreField = isPlayer1 ? 'player1Score' : 'player2Score';
    const currentScore = isPlayer1 ? match.player1Score : match.player2Score;
    await this.battleRepo.updateMatch(matchId, {
      [scoreField]: currentScore + points,
    });

    // Check if both players answered (or bot)
    const updatedRound = await this.battleRepo.findRound(matchId, roundNumber);
    const bothAnswered = updatedRound!.player1Answer !== null && updatedRound!.player2Answer !== null;

    return {
      isCorrect,
      points,
      bothAnswered,
      correctAnswer: bothAnswered ? correctAnswer : undefined,
    };
  }

  // ─── Bot answer (auto-respond) ───

  async botAnswer(matchId: string, roundNumber: number) {
    const round = await this.battleRepo.findRound(matchId, roundNumber);
    if (!round) return;

    const correctAnswer = (round.questionData as any).correctAnswer;
    const options = (round.questionData as any).options || [];

    // 70% accuracy
    const isCorrect = Math.random() < 0.7;
    const answer = isCorrect ? correctAnswer : (options.find((o: string) => o !== correctAnswer) || correctAnswer);
    const timeMs = 3000 + Math.floor(Math.random() * 7000); // 3-10 seconds

    let points = 0;
    if (isCorrect) {
      const speedBonus = Math.max(0, Math.floor((ROUND_TIME_LIMIT - timeMs) / 1000) * 10);
      points = BASE_POINTS + speedBonus;
    }

    await this.battleRepo.updateRoundAnswer(round.id, 2, answer, timeMs, points);

    // Update bot score
    const match = await this.battleRepo.findMatchById(matchId);
    if (match) {
      await this.battleRepo.updateMatch(matchId, {
        player2Score: match.player2Score + points,
      });
    }

    return { answer, timeMs, points, isCorrect };
  }

  // ─── Complete match ───

  async completeMatch(matchId: string) {
    const match = await this.battleRepo.findMatchById(matchId);
    if (!match) throw new Error('Match not found');

    let winnerId: string | null = null;
    if (match.player1Score > match.player2Score) winnerId = match.player1Id;
    else if (match.player2Score > match.player1Score) winnerId = match.player2Id;

    // Calculate XP rewards
    const isBot = match.isBot;
    let xp1 = 10, xp2 = 10; // base lose XP

    if (winnerId === match.player1Id) {
      xp1 = isBot ? 15 : 30;
    } else if (winnerId === match.player2Id) {
      xp2 = isBot ? 15 : 30;
    } else {
      xp1 = 20; xp2 = 20; // draw
    }

    await this.battleRepo.updateMatch(matchId, {
      status: 'COMPLETED',
      winnerId,
      xpAwarded1: xp1,
      xpAwarded2: xp2,
      completedAt: new Date(),
    });

    // Clean up active match tracking
    await this.battleRepo.removeActiveMatch(match.player1Id);
    if (match.player2Id && !isBot) {
      await this.battleRepo.removeActiveMatch(match.player2Id);
    }

    // Fire-and-forget: update leaderboard XP
    this.leaderboardService.updateUserXp(match.player1Id, xp1).catch(() => {});
    if (match.player2Id && !isBot) {
      this.leaderboardService.updateUserXp(match.player2Id, xp2).catch(() => {});
    }

    // Fire-and-forget: feed auto-post for win streak
    if (winnerId) {
      this.checkAndCreateFeedPost(winnerId).catch(() => {});
    }

    return {
      matchId,
      winnerId,
      player1Score: match.player1Score,
      player2Score: match.player2Score,
      xpAwarded: { player1: xp1, player2: xp2 },
      isBot,
    };
  }

  private async checkAndCreateFeedPost(userId: string) {
    const streak = await this.battleRepo.getRecentWinStreak(userId);
    if (streak >= 3) {
      await this.feedService.autoCreatePost(userId, 'BATTLE_WIN_STREAK', {
        winStreak: streak,
      });
    }
  }

  // ─── Get round question (sanitized, no answer) ───

  getRoundQuestion(round: any) {
    const data = round.questionData as any;
    return {
      roundNumber: round.roundNumber,
      questionType: round.questionType,
      prompt: data.prompt,
      options: data.options,
      audioUrl: data.audioUrl,
      timeLimit: ROUND_TIME_LIMIT,
    };
  }

  // ─── Bot info ───

  generateBotInfo() {
    const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    return {
      id: `BOT_${Date.now()}`,
      username: name,
      fullName: name,
      profilePictureUrl: null,
      currentLevel: Math.floor(Math.random() * 20) + 5,
      isBot: true,
    };
  }
}
