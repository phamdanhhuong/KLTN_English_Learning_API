export interface LeagueHistoryRepository {
  create(data: {
    userId: string;
    tier: string;
    weekStartDate: Date;
    weeklyXp: number;
    rank: number;
    outcome: string;
  }): Promise<void>;

  findByUser(userId: string, limit?: number): Promise<any[]>;
}
