import {
  Controller, Post, Get, UseGuards, Request, Param, Query, Body,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { GetUserQuestsUseCase, GetCompletedQuestsUseCase } from '../application/use-cases/get-quests.usecase';
import { ClaimQuestUseCase, GetUnlockedChestsUseCase, OpenChestUseCase } from '../application/use-cases/claim-quest.usecase';
import {
  GetFriendsQuestParticipantsUseCase,
  JoinFriendsQuestUseCase,
  InviteFriendToQuestUseCase,
} from '../application/use-cases/friends-quest.usecase';

@Controller('quests')
@UseGuards(JwtAuthGuard)
export class QuestController {
  constructor(
    private readonly getUserQuests: GetUserQuestsUseCase,
    private readonly getCompletedQuests: GetCompletedQuestsUseCase,
    private readonly claimQuest: ClaimQuestUseCase,
    private readonly getUnlockedChests: GetUnlockedChestsUseCase,
    private readonly openChest: OpenChestUseCase,
    private readonly getParticipants: GetFriendsQuestParticipantsUseCase,
    private readonly joinFriendsQuest: JoinFriendsQuestUseCase,
    private readonly inviteFriend: InviteFriendToQuestUseCase,
  ) {}

  @Get()
  async getQuests(@Request() req: any, @Query('active') active?: string) {
    return this.getUserQuests.execute(req.user.sub, active === 'true');
  }

  @Get('completed')
  async getCompleted(@Request() req: any) {
    return this.getCompletedQuests.execute(req.user.sub);
  }

  @Post(':questId/claim')
  @HttpCode(HttpStatus.OK)
  async claim(@Request() req: any, @Param('questId') questId: string) {
    return this.claimQuest.execute(req.user.sub, questId);
  }

  // Mobile calls GET /users/quests/chests → handled by UserQuestController below
  // Also expose at /quests/chests for backwards compatibility
  @Get('chests')
  async getChests(@Request() req: any) {
    return this.getUnlockedChests.execute(req.user.sub);
  }

  @Post('chests/:chestId/open')
  @HttpCode(HttpStatus.OK)
  async openChestEndpoint(@Request() req: any, @Param('chestId') chestId: string) {
    return this.openChest.execute(req.user.sub, chestId);
  }

  @Get('friends/:key/participants')
  async getFriendsParticipants(@Param('key') key: string) {
    return this.getParticipants.execute(key);
  }

  @Post('friends/:key/join')
  @HttpCode(HttpStatus.OK)
  async joinQuest(@Request() req: any, @Param('key') key: string) {
    return this.joinFriendsQuest.execute(req.user.sub, key);
  }

  // Mobile sends body { friendId: "..." } — fix from @Query to @Body
  @Post('friends/:key/invite')
  @HttpCode(HttpStatus.OK)
  async inviteToQuest(
    @Request() req: any,
    @Param('key') key: string,
    @Body('friendId') friendId: string,
  ) {
    return this.inviteFriend.execute(req.user.sub, key, friendId);
  }
}
