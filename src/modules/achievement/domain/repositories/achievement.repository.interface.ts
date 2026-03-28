export interface AchievementDefinition {
  id: string;
  key: string;
  name: string;
  description: string;
  iconUrl: string | null;
  badgeUrl: string | null;
  category: string;
  tier: number;
  requirement: number;
  rewardXp: number;
  rewardGems: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAchievementRecord {
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  isUnlocked: boolean;
  unlockedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  achievement: AchievementDefinition;
}

export interface AchievementRepository {
  /** Get all achievement definitions (cached) */
  findAllDefinitions(): Promise<AchievementDefinition[]>;

  /** Get user's achievement records with definitions */
  findUserAchievements(userId: string): Promise<UserAchievementRecord[]>;

  /** Upsert user achievement progress & unlock status */
  upsertProgress(
    userId: string,
    achievementId: string,
    progress: number,
    isUnlocked: boolean,
  ): Promise<{ isUnlocked: boolean; wasAlreadyUnlocked: boolean }>;

  /** Grant XP + Gems rewards for achievement unlock */
  grantRewards(
    userId: string,
    rewardXp: number,
    rewardGems: number,
    achievementName: string,
  ): Promise<void>;

  /** Invalidate user achievement cache */
  invalidateUserCache(userId: string): Promise<void>;
}
