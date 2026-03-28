export interface UserTierRepository {
  findByUserId(userId: string): Promise<any | null>;
  create(userId: string): Promise<any>;
  getOrCreate(userId: string): Promise<any>;
  updateCurrentGroup(userId: string, groupId: string): Promise<void>;
  changeTier(userId: string, direction: 'up' | 'down'): Promise<{ oldTier: string; newTier: string }>;
  invalidateCache(userId: string): Promise<void>;
}
