import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { GenerateMiniGameUseCase } from '../../application/use-cases/generate-mini-game.usecase';
import { SubmitMiniGameScoreUseCase } from '../../application/use-cases/submit-mini-game.usecase';
import { SubmitMiniGameDto } from '../../application/dto/submit-mini-game.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { MiniGameType } from '@prisma/client';
import { Inject } from '@nestjs/common';
import { UserMiniGameRepository } from '../../domain/repositories/user-mini-game.repository.interface';

@Controller('mini-games')
@UseGuards(JwtAuthGuard)
export class MiniGameController {
  constructor(
    private readonly generateMiniGameUseCase: GenerateMiniGameUseCase,
    private readonly submitMiniGameScoreUseCase: SubmitMiniGameScoreUseCase,
    @Inject('UserMiniGameRepository')
    private readonly repository: UserMiniGameRepository,
  ) {}

  @Get('part/:partId/status')
  async getStatus(@Request() req, @Param('partId') partId: string) {
    const userId = req.user.sub;
    return this.repository.findStatusByPart(userId, partId);
  }

  @Get('part/:partId/play')
  async generateGame(
    @Request() req,
    @Param('partId') partId: string,
    @Query('type') type: MiniGameType,
  ) {
    const userId = req.user.sub;
    // Mặc định type nếu client không truyền
    const gameType = type || MiniGameType.ARCADE;
    return this.generateMiniGameUseCase.execute(userId, partId, gameType);
  }

  @Post('submit')
  async submitScore(@Request() req, @Body() submitDto: SubmitMiniGameDto) {
    const userId = req.user.sub;
    return this.submitMiniGameScoreUseCase.execute(userId, submitDto);
  }
}
