export interface BattleRepository {
  // Match CRUD
  createMatch(player1Id: string, tier: string, isBot?: boolean): Promise<any>;
  findMatchById(matchId: string): Promise<any | null>;
  updateMatch(matchId: string, data: Record<string, any>): Promise<any>;
  setMatchPlayer2(matchId: string, player2Id: string): Promise<any>;

  // Rounds
  createRounds(matchId: string, rounds: Array<{
    roundNumber: number;
    questionType: string;
    questionData: Record<string, any>;
  }>): Promise<void>;
  findRound(matchId: string, roundNumber: number): Promise<any | null>;
  updateRoundAnswer(
    roundId: string,
    playerNum: 1 | 2,
    answer: string,
    timeMs: number,
    points: number,
  ): Promise<any>;
  getMatchRounds(matchId: string): Promise<any[]>;

  // Match history & stats
  getUserMatches(userId: string, limit: number, offset: number): Promise<any[]>;
  getUserStats(userId: string): Promise<{
    totalMatches: number;
    wins: number;
    losses: number;
    draws: number;
    winStreak: number;
    bestWinStreak: number;
  }>;
  getRecentWinStreak(userId: string): Promise<number>;

  // Queue (Redis)
  addToQueue(userId: string, tier: string): Promise<void>;
  removeFromQueue(userId: string): Promise<void>;
  findOpponentInQueue(tier: string, excludeUserId: string): Promise<string | null>;
  findOpponentExpandedTier(tier: string, excludeUserId: string): Promise<string | null>;
  getQueueSize(tier: string): Promise<number>;

  // Active match tracking (Redis)
  setActiveMatch(userId: string, matchId: string): Promise<void>;
  getActiveMatch(userId: string): Promise<string | null>;
  removeActiveMatch(userId: string): Promise<void>;

  // Exercise questions
  getRandomExercises(tier: string, count: number): Promise<any[]>;

  // User info
  getUserBasicInfo(userId: string): Promise<{
    id: string;
    username: string | null;
    fullName: string | null;
    profilePictureUrl: string | null;
    currentLevel: number;
  } | null>;
  getUserTier(userId: string): Promise<string>;
}
