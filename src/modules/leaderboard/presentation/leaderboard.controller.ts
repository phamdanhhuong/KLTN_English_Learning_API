import {
  Controller, Post, Get, UseGuards, Request, Body,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { LeaderboardService } from '../application/services/leaderboard.service';

@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Post('join')
  @HttpCode(HttpStatus.OK)
  async joinLeague(@Request() req: any) {
    return this.leaderboardService.joinLeague(req.user.sub);
  }

  @Get('standings')
  async getStandings(@Request() req: any) {
    return this.leaderboardService.getLeaderboard(req.user.sub);
  }

  @Get('tier')
  async getUserTier(@Request() req: any) {
    return this.leaderboardService.getUserTier(req.user.sub);
  }

  @Get('history')
  async getHistory(@Request() req: any) {
    return this.leaderboardService.getHistory(req.user.sub);
  }

  @Post('xp')
  @HttpCode(HttpStatus.OK)
  async updateXp(
    @Request() req: any,
    @Body('amount') amount: number,
  ) {
    await this.leaderboardService.updateUserXp(req.user.sub, amount);
    return { updated: true, amount };
  }
}
