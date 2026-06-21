import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { UserMiniGameRepository } from '../../domain/repositories/user-mini-game.repository.interface';
import { MiniGameType, UserMiniGame } from '@prisma/client';

@Injectable()
export class PrismaUserMiniGameRepository implements UserMiniGameRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndPart(userId: string, partId: string, type: MiniGameType): Promise<UserMiniGame | null> {
    return this.prisma.userMiniGame.findUnique({
      where: {
        userId_partId_gameType: {
          userId,
          partId,
          gameType: type,
        },
      },
    });
  }

  async findStatusByPart(userId: string, partId: string): Promise<UserMiniGame[]> {
    return this.prisma.userMiniGame.findMany({
      where: {
        userId,
        partId,
      },
    });
  }

  async upsertRecord(data: Omit<UserMiniGame, 'id' | 'lastPlayed'>): Promise<UserMiniGame> {
    return this.prisma.userMiniGame.upsert({
      where: {
        userId_partId_gameType: {
          userId: data.userId,
          partId: data.partId,
          gameType: data.gameType,
        },
      },
      update: {
        bestScore: data.bestScore,
        stars: data.stars,
        playCount: data.playCount,
        bestTimeMs: data.bestTimeMs,
        lastPlayed: new Date(),
      },
      create: {
        userId: data.userId,
        partId: data.partId,
        gameType: data.gameType,
        bestScore: data.bestScore,
        stars: data.stars,
        playCount: data.playCount,
        bestTimeMs: data.bestTimeMs,
      },
    });
  }
}
