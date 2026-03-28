export interface UserQuestWithQuest {
  id: string;
  userId: string;
  questId: string;
  progress: number;
  requirement: number;
  difficultyLevel: string;
  status: string;
  startDate: Date;
  endDate: Date;
  completedAt: Date | null;
  claimedAt: Date | null;
  quest: {
    id: string;
    key: string;
    type: string;
    category: string;
    name: string;
    description: string;
    iconUrl: string | null;
    baseRequirement: number;
    rewardXp: number;
    rewardGems: number;
    chestType: string | null;
    badgeIconUrl: string | null;
  };
}

export interface UserQuestRepository {
  /** Find active user quest for a specific quest definition */
  findExisting(userId: string, questId: string, minEndDate: Date): Promise<any | null>;

  /** Create a new user quest */
  create(data: {
    userId: string;
    questId: string;
    requirement: number;
    startDate: Date;
    endDate: Date;
  }): Promise<any>;

  /** Create a chest for a user quest */
  createChest(userQuestId: string, chestType: string, rewards: Record<string, number>): Promise<void>;

  /** Find active quests by user */
  findActiveByUser(userId: string): Promise<UserQuestWithQuest[]>;

  /** Update quest progress */
  updateProgress(id: string, progress: number, isCompleted: boolean): Promise<void>;

  /** Unlock chest for a user quest */
  unlockChest(userQuestId: string): Promise<void>;

  /** Mark expired quests */
  markExpired(userId: string): Promise<void>;

  /** Update friends quest contribution */
  updateFriendsContribution(userId: string, weekStart: Date): Promise<void>;

  /** Invalidate user quest cache */
  invalidateCache(userId: string): Promise<void>;
}
