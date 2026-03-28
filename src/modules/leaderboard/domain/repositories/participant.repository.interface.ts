export interface ParticipantRepository {
  findUserActiveParticipation(userId: string, weekStart: Date): Promise<any | null>;
  create(groupId: string, userId: string): Promise<any>;
  updateXp(participantId: string, xpToAdd: number): Promise<void>;
  getStandingsFromDB(groupId: string, currentUserId: string): Promise<any[]>;

  // Redis sorted set operations
  addToRedis(groupId: string, score: number, userId: string): Promise<void>;
  incrXpRedis(groupId: string, xpToAdd: number, userId: string): Promise<void>;
  getStandingsFromRedis(groupId: string, currentUserId: string): Promise<any[]>;
  backfillRedis(groupId: string): Promise<void>;
  deleteRedisKey(groupId: string): Promise<void>;
}
