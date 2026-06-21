import { MiniGameType, UserMiniGame } from '@prisma/client';

export interface UserMiniGameRepository {
  findByUserAndPart(userId: string, partId: string, type: MiniGameType): Promise<UserMiniGame | null>;
  findStatusByPart(userId: string, partId: string): Promise<UserMiniGame[]>;
  upsertRecord(data: Omit<UserMiniGame, 'id' | 'lastPlayed'>): Promise<UserMiniGame>;
}
