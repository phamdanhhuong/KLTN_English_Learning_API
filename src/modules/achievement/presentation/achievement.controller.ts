import {
  Controller, Get, UseGuards, Request, Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { GetUserAchievementsUseCase, GetAchievementsSummaryUseCase } from '../application/use-cases/get-achievements.usecase';

@Controller('achievements')
@UseGuards(JwtAuthGuard)
export class AchievementController {
  constructor(
    private readonly getUserAchievementsUseCase: GetUserAchievementsUseCase,
    private readonly getAchievementsSummaryUseCase: GetAchievementsSummaryUseCase,
  ) {}

  @Get()
  async getAchievements(
    @Request() req: any,
    @Query('unlocked') unlocked?: string,
  ) {
    const onlyUnlocked = unlocked === 'true';
    return this.getUserAchievementsUseCase.execute(req.user.sub, onlyUnlocked);
  }

  @Get('summary')
  async getAchievementsSummary(@Request() req: any) {
    return this.getAchievementsSummaryUseCase.execute(req.user.sub);
  }
}
