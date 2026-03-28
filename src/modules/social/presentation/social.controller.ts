import {
  Controller, Post, Delete, Get, UseGuards, Request, Param, Query,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { FollowUserUseCase } from '../application/use-cases/follow-user.usecase';
import { UnfollowUserUseCase } from '../application/use-cases/unfollow-user.usecase';
import { GetFollowingUseCase, GetFollowersUseCase } from '../application/use-cases/get-follow-lists.usecase';
import { GetSuggestedFriendsUseCase } from '../application/use-cases/get-suggested-friends.usecase';
import { SearchUsersUseCase } from '../application/use-cases/search-users.usecase';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(
    private readonly followUserUseCase: FollowUserUseCase,
    private readonly unfollowUserUseCase: UnfollowUserUseCase,
    private readonly getFollowingUseCase: GetFollowingUseCase,
    private readonly getFollowersUseCase: GetFollowersUseCase,
    private readonly getSuggestedFriendsUseCase: GetSuggestedFriendsUseCase,
    private readonly searchUsersUseCase: SearchUsersUseCase,
  ) {}

  @Post('follow/:userId')
  @HttpCode(HttpStatus.OK)
  async followUser(@Request() req: any, @Param('userId') targetUserId: string) {
    return this.followUserUseCase.execute(req.user.sub, targetUserId);
  }

  @Delete('follow/:userId')
  async unfollowUser(@Request() req: any, @Param('userId') targetUserId: string) {
    return this.unfollowUserUseCase.execute(req.user.sub, targetUserId);
  }

  @Get('following')
  async getFollowing(
    @Request() req: any,
    @Query('userId') userId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const targetUserId = userId || req.user.sub;
    return this.getFollowingUseCase.execute(targetUserId, limit ?? 50, offset ?? 0);
  }

  @Get('followers')
  async getFollowers(
    @Request() req: any,
    @Query('userId') userId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const targetUserId = userId || req.user.sub;
    return this.getFollowersUseCase.execute(targetUserId, limit ?? 50, offset ?? 0);
  }

  @Get('suggestions')
  async getSuggestedFriends(@Request() req: any) {
    return this.getSuggestedFriendsUseCase.execute(req.user.sub);
  }

  @Get('search')
  async searchUsers(@Request() req: any, @Query('query') query: string) {
    return this.searchUsersUseCase.execute(req.user.sub, query);
  }
}
