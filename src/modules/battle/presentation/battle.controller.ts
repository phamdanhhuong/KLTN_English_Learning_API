import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { BattleGameService } from '../application/services/battle-game.service';
import { Inject } from '@nestjs/common';
import { BATTLE_TOKENS } from '../domain/di/tokens';
import type { BattleRepository } from '../domain/repositories/battle.repository.interface';

@Controller('battle')
@UseGuards(JwtAuthGuard)
export class BattleController {
  constructor(
    @Inject(BATTLE_TOKENS.BATTLE_REPOSITORY)
    private readonly battleRepo: BattleRepository,
    private readonly gameService: BattleGameService,
  ) {}

  @Get('history')
  async getHistory(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const userId = req.user.sub;
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    const matches = await this.battleRepo.getUserMatches(
      userId,
      parsedLimit,
      parsedOffset,
    );

    return matches.map((m: any) => ({
      id: m.id,
      opponent: m.player1Id === userId ? m.player2 : m.player1,
      myScore: m.player1Id === userId ? m.player1Score : m.player2Score,
      opponentScore: m.player1Id === userId ? m.player2Score : m.player1Score,
      result:
        m.winnerId === userId ? 'WIN' : m.winnerId === null ? 'DRAW' : 'LOSE',
      xpEarned: m.player1Id === userId ? m.xpAwarded1 : m.xpAwarded2,
      isBot: m.isBot,
      completedAt: m.completedAt,
    }));
  }

  @Get('history/:userId')
  async getPublicHistory(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    const matches = await this.battleRepo.getUserPublicMatches(
      userId,
      parsedLimit,
      parsedOffset,
    );

    return matches.map((m: any) => ({
      id: m.id,
      opponent: m.player1Id === userId ? m.player2 : m.player1,
      myScore: m.player1Id === userId ? m.player1Score : m.player2Score,
      opponentScore: m.player1Id === userId ? m.player2Score : m.player1Score,
      result:
        m.winnerId === userId ? 'WIN' : m.winnerId === null ? 'DRAW' : 'LOSE',
      xpEarned: m.player1Id === userId ? m.xpAwarded1 : m.xpAwarded2,
      isBot: m.isBot,
      completedAt: m.completedAt,
    }));
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    return this.battleRepo.getUserStats(req.user.sub);
  }

  @Get('match/:matchId')
  async getMatch(@Param('matchId') matchId: string) {
    return this.battleRepo.findMatchById(matchId);
  }
}
