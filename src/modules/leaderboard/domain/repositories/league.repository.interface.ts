export interface LeagueRepository {
  findByTierAndWeek(tier: string, weekStartDate: Date): Promise<any | null>;
  create(tier: string, weekStartDate: Date, weekEndDate: Date): Promise<any>;
  findAvailableGroup(leagueId: string): Promise<any | null>;
  createGroup(leagueId: string, groupNumber: number): Promise<any>;
  countGroups(leagueId: string): Promise<number>;
  incrementGroupParticipant(groupId: string, currentCount: number, maxParticipants: number): Promise<void>;
  findGroupWithLeague(groupId: string): Promise<any | null>;
  findActiveLeaguesByWeek(weekStartDate: Date): Promise<any[]>;
  archiveLeague(leagueId: string): Promise<void>;
}
