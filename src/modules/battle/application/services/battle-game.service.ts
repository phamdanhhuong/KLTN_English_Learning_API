import { Injectable, Inject, Logger } from '@nestjs/common';
import { BATTLE_TOKENS } from '../../domain/di/tokens';
import type { BattleRepository } from '../../domain/repositories/battle.repository.interface';
import { FeedService } from '../../../feed/application/services/feed.service';
import { LeaderboardService } from '../../../leaderboard/application/services/leaderboard.service';

const BOT_NAMES = [
  'EnglishMaster', 'QuizKing', 'WordNinja', 'VocabHero',
  'GrammarPro', 'SpellWizard', 'LexiconLord', 'PhraseMaster',
];

// ─── Combat Constants ───
const TOTAL_ROUNDS = 7;
const ROUND_TIME_LIMIT = 15000; // 15 seconds
const MAX_HP = 1000;
const BASE_DAMAGE = 150;
const MAX_SPEED_BONUS = 100; // extra damage for speed
const SELF_DAMAGE = 50;      // penalty for wrong answer / timeout

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

    // Set initial HP (stored as score fields, starting at MAX_HP)
    await this.battleRepo.updateMatch(match.id, {
      player1Score: MAX_HP,
      player2Score: MAX_HP,
    });

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
        exerciseType: ex.exerciseType || ex.type,
        rawMeta: ex.rawMeta || null,
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
          exerciseType: 'multiple_choice',
          rawMeta: null,
        },
      });
    }

    await this.battleRepo.createRounds(match.id, rounds);

    return {
      matchId: match.id,
      totalRounds: TOTAL_ROUNDS,
      timePerRound: ROUND_TIME_LIMIT,
      maxHp: MAX_HP,
    };
  }

  // ─── Submit answer → calculate DAMAGE (not points) ───

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

    // ─── HP Combat Logic ───
    const correctAnswer = (round.questionData as any).correctAnswer;
    const isCorrect = answer === correctAnswer;

    let damage = 0;
    let selfDamage = 0;
    let attackerHp: number;
    let targetHp: number;

    if (isCorrect) {
      // Speed bonus: faster = more damage (0-100 bonus)
      const speedRatio = Math.max(0, (ROUND_TIME_LIMIT - timeMs) / ROUND_TIME_LIMIT);
      damage = BASE_DAMAGE + Math.floor(speedRatio * MAX_SPEED_BONUS);
    } else {
      // Wrong answer or timeout → self-damage
      selfDamage = SELF_DAMAGE;
    }

    // Apply damage to HP
    if (isPlayer1) {
      // P1 attacks P2 (or P1 self-damages)
      const newP2Hp = Math.max(0, match.player2Score - damage);
      const newP1Hp = Math.max(0, match.player1Score - selfDamage);
      await this.battleRepo.updateMatch(matchId, {
        player1Score: newP1Hp,
        player2Score: newP2Hp,
      });
      attackerHp = newP1Hp;
      targetHp = newP2Hp;
    } else {
      // P2 attacks P1 (or P2 self-damages)
      const newP1Hp = Math.max(0, match.player1Score - damage);
      const newP2Hp = Math.max(0, match.player2Score - selfDamage);
      await this.battleRepo.updateMatch(matchId, {
        player1Score: newP1Hp,
        player2Score: newP2Hp,
      });
      attackerHp = newP2Hp;
      targetHp = newP1Hp;
    }

    // Store answer for round record
    const points = isCorrect ? damage : -selfDamage;
    await this.battleRepo.updateRoundAnswer(round.id, playerNum, answer, timeMs, points);

    // Check if both players answered this round
    const updatedRound = await this.battleRepo.findRound(matchId, roundNumber);
    const bothAnswered = updatedRound!.player1Answer !== null && updatedRound!.player2Answer !== null;

    // Reload match for latest HP
    const updatedMatch = await this.battleRepo.findMatchById(matchId);

    // Check KO
    const isKO = updatedMatch!.player1Score <= 0 || updatedMatch!.player2Score <= 0;

    return {
      isCorrect,
      damage,
      selfDamage,
      attackerHp,
      targetHp,
      attackerId: userId,
      targetId: isPlayer1 ? match.player2Id : match.player1Id,
      correctAnswer,
      roundNumber,
      bothAnswered,
      isKO,
      player1Hp: updatedMatch!.player1Score,
      player2Hp: updatedMatch!.player2Score,
    };
  }

  // ─── Bot answer (HP combat version) ───

  async botAnswer(matchId: string, roundNumber: number) {
    const round = await this.battleRepo.findRound(matchId, roundNumber);
    if (!round) return null;
    if (round.player2Answer !== null) return null; // already answered

    const correctAnswer = (round.questionData as any).correctAnswer;
    const options = (round.questionData as any).options || [];

    // 70% accuracy
    const isCorrect = Math.random() < 0.7;
    const answer = isCorrect
      ? correctAnswer
      : (options.find((o: string) => o !== correctAnswer) || correctAnswer);
    const timeMs = 3000 + Math.floor(Math.random() * 7000); // 3-10 seconds

    const match = await this.battleRepo.findMatchById(matchId);
    if (!match) return null;

    let damage = 0;
    let selfDamage = 0;

    if (isCorrect) {
      const speedRatio = Math.max(0, (ROUND_TIME_LIMIT - timeMs) / ROUND_TIME_LIMIT);
      damage = BASE_DAMAGE + Math.floor(speedRatio * MAX_SPEED_BONUS);
    } else {
      selfDamage = SELF_DAMAGE;
    }

    // Bot is player2, attacks player1
    const newP1Hp = Math.max(0, match.player1Score - damage);
    const newP2Hp = Math.max(0, match.player2Score - selfDamage);
    await this.battleRepo.updateMatch(matchId, {
      player1Score: newP1Hp,
      player2Score: newP2Hp,
    });

    const points = isCorrect ? damage : -selfDamage;
    await this.battleRepo.updateRoundAnswer(round.id, 2, answer, timeMs, points);

    const isKO = newP1Hp <= 0 || newP2Hp <= 0;

    return {
      isCorrect,
      damage,
      selfDamage,
      attackerHp: newP2Hp,
      targetHp: newP1Hp,
      player1Hp: newP1Hp,
      player2Hp: newP2Hp,
      roundNumber,
      isKO,
      answer,
      timeMs,
    };
  }

  // ─── Complete match ───

  async completeMatch(matchId: string) {
    const match = await this.battleRepo.findMatchById(matchId);
    if (!match) throw new Error('Match not found');

    // Winner = opponent whose HP reached 0 first loses, or higher HP wins
    let winnerId: string | null = null;
    const p1Hp = match.player1Score;
    const p2Hp = match.player2Score;

    if (p1Hp <= 0 && p2Hp > 0) winnerId = match.player2Id;
    else if (p2Hp <= 0 && p1Hp > 0) winnerId = match.player1Id;
    else if (p1Hp > p2Hp) winnerId = match.player1Id;
    else if (p2Hp > p1Hp) winnerId = match.player2Id;
    // else draw (both 0 or equal)

    // XP rewards
    const isBot = match.isBot;
    let xp1 = 10, xp2 = 10;

    if (winnerId === match.player1Id) {
      xp1 = isBot ? 15 : 30;
    } else if (winnerId === match.player2Id) {
      xp2 = isBot ? 15 : 30;
    } else {
      xp1 = 20; xp2 = 20;
    }

    // Check if KO (someone reached 0)
    const isKO = p1Hp <= 0 || p2Hp <= 0;

    await this.battleRepo.updateMatch(matchId, {
      status: 'COMPLETED',
      winnerId,
      xpAwarded1: xp1,
      xpAwarded2: xp2,
      completedAt: new Date(),
    });

    // Clean up
    await this.battleRepo.removeActiveMatch(match.player1Id);
    if (match.player2Id && !isBot) {
      await this.battleRepo.removeActiveMatch(match.player2Id);
    }

    // Fire-and-forget: XP + feed
    this.leaderboardService.updateUserXp(match.player1Id, xp1).catch(() => {});
    if (match.player2Id && !isBot) {
      this.leaderboardService.updateUserXp(match.player2Id, xp2).catch(() => {});
    }
    if (winnerId) {
      this.checkAndCreateFeedPost(winnerId).catch(() => {});
    }

    return {
      matchId,
      winnerId,
      player1Hp: p1Hp,
      player2Hp: p2Hp,
      isKO,
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
      exerciseType: data.exerciseType || round.questionType,
      exerciseId: data.exerciseId || null,
      prompt: data.prompt,
      options: data.options,
      audioUrl: data.audioUrl,
      timeLimit: ROUND_TIME_LIMIT,
      rawMeta: data.rawMeta || null,
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

  getMaxHp() { return MAX_HP; }
}
