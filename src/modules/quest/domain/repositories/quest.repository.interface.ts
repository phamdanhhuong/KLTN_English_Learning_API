export interface QuestDefinition {
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
  order: number;
  isActive: boolean;
  requiresMultiplayer: boolean;
}

export interface QuestRepository {
  /** Get all active quest definitions (cached) */
  findAllActive(): Promise<QuestDefinition[]>;
}
