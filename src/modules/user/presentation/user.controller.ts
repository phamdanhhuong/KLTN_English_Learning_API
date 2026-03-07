import {
  Controller, Get, Patch, Body, UseGuards, Request, Param, Query,
} from '@nestjs/common';
import { GetProfileUseCase } from '../application/use-cases/get-profile.usecase';
import { UpdateProfileUseCase, UpdateProfileDto } from '../application/use-cases/update-profile.usecase';
import { UpdatePreferencesUseCase, UpdatePreferencesDto } from '../application/use-cases/update-preferences.usecase';
import { GetUserStatsUseCase } from '../application/use-cases/get-stats.usecase';
import { GetXpHistoryUseCase } from '../application/use-cases/get-xp-history.usecase';
import { GetPublicProfileUseCase, SearchUsersUseCase } from '../application/use-cases/get-public-profile.usecase';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly updatePreferencesUseCase: UpdatePreferencesUseCase,
    private readonly getUserStatsUseCase: GetUserStatsUseCase,
    private readonly getXpHistoryUseCase: GetXpHistoryUseCase,
    private readonly getPublicProfileUseCase: GetPublicProfileUseCase,
    private readonly searchUsersUseCase: SearchUsersUseCase,
  ) {}

  // ── Own profile ──────────────────────────────────────────
  @Get('me')
  async getMyProfile(@Request() req: any) {
    return this.getProfileUseCase.execute(req.user.sub);
  }

  @Get('me/stats')
  async getMyStats(@Request() req: any) {
    return this.getUserStatsUseCase.execute(req.user.sub);
  }

  @Get('me/xp-history')
  async getXpHistory(@Request() req: any, @Query('days') days?: number) {
    return this.getXpHistoryUseCase.execute(req.user.sub, days ?? 7);
  }

  @Patch('me')
  async updateMyProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.updateProfileUseCase.execute(req.user.sub, dto);
  }

  @Patch('me/preferences')
  async updateMyPreferences(@Request() req: any, @Body() dto: UpdatePreferencesDto) {
    return this.updatePreferencesUseCase.execute(req.user.sub, dto);
  }

  // ── Search & Public profile ───────────────────────────────
  @Get('search')
  async searchUsers(@Query('username') username: string, @Query('limit') limit?: number) {
    return this.searchUsersUseCase.execute(username ?? '', limit ?? 10);
  }

  @Get(':userId/profile')
  async getPublicProfile(@Param('userId') userId: string) {
    return this.getPublicProfileUseCase.execute(userId);
  }
}
