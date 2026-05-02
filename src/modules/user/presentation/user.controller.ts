import {
  Controller, Get, Patch, Post, Delete, Body, UseGuards, Request, Param, Query,
} from '@nestjs/common';
import { GetProfileUseCase } from '../application/use-cases/get-profile.usecase';
import { UpdateProfileUseCase, UpdateProfileDto } from '../application/use-cases/update-profile.usecase';
import { UpdatePreferencesUseCase, UpdatePreferencesDto } from '../application/use-cases/update-preferences.usecase';
import { GetUserStatsUseCase } from '../application/use-cases/get-stats.usecase';
import { GetXpHistoryUseCase } from '../application/use-cases/get-xp-history.usecase';
import { GetPublicProfileUseCase, SearchUsersUseCase } from '../application/use-cases/get-public-profile.usecase';
import { ReportUserUseCase, BlockUserUseCase, UnblockUserUseCase } from '../application/use-cases/report-block.usecase';
import { DeleteAccountUseCase } from '../application/use-cases/delete-account.usecase';
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
    private readonly reportUserUseCase: ReportUserUseCase,
    private readonly blockUserUseCase: BlockUserUseCase,
    private readonly unblockUserUseCase: UnblockUserUseCase,
    private readonly deleteAccountUseCase: DeleteAccountUseCase,
  ) {}

  // ── Own profile ──────────────────────────────────────────
  // Mobile: GET /users/profile
  @Get('profile')
  async getMyProfile(@Request() req: any) {
    return this.getProfileUseCase.execute(req.user.sub);
  }

  // Mobile: PATCH /users/profile
  @Patch('profile')
  async updateMyProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.updateProfileUseCase.execute(req.user.sub, dto);
  }

  // Mobile: DELETE /users/profile
  @Delete('profile')
  async deleteMyProfile(@Request() req: any) {
    return this.deleteAccountUseCase.execute(req.user.sub);
  }

  @Get('profile/stats')
  async getMyStats(@Request() req: any) {
    return this.getUserStatsUseCase.execute(req.user.sub);
  }

  @Get('profile/xp-history')
  async getXpHistory(@Request() req: any, @Query('days') days?: number) {
    return this.getXpHistoryUseCase.execute(req.user.sub, days ?? 7);
  }

  @Patch('profile/preferences')
  async updateMyPreferences(@Request() req: any, @Body() dto: UpdatePreferencesDto) {
    return this.updatePreferencesUseCase.execute(req.user.sub, dto);
  }

  // ── Public profile ────────────────────────────────────────
  // Mobile: GET /users/profile/:userId
  @Get('profile/:userId')
  async getPublicProfile(@Param('userId') userId: string, @Request() req: any) {
    return this.getPublicProfileUseCase.execute(userId, req.user.sub);
  }

  // ── Search ───────────────────────────────────────────────
  @Get('search')
  async searchUsers(@Query('username') username: string, @Query('limit') limit?: number) {
    return this.searchUsersUseCase.execute(username ?? '', limit ?? 10);
  }

  // ── Report & Block ────────────────────────────────────────
  // Mobile: POST /users/:userId/report
  @Post(':userId/report')
  async reportUser(
    @Request() req: any,
    @Param('userId') userId: string,
    @Body('reason') reason: string,
    @Body('description') description?: string,
  ) {
    return this.reportUserUseCase.execute(req.user.sub, userId, reason, description);
  }

  // Mobile: POST /users/:userId/block
  @Post(':userId/block')
  async blockUser(@Request() req: any, @Param('userId') userId: string) {
    return this.blockUserUseCase.execute(req.user.sub, userId);
  }

  // Mobile: DELETE /users/:userId/block
  @Delete(':userId/block')
  async unblockUser(@Request() req: any, @Param('userId') userId: string) {
    return this.unblockUserUseCase.execute(req.user.sub, userId);
  }
}
