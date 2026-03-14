import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { GetUnlockedChestsUseCase } from '../application/use-cases/claim-quest.usecase';

/**
 * Mobile calls GET /users/quests/chests — this controller serves that path.
 * The main QuestController at /quests also exposes GET /quests/chests.
 */
@Controller('users/quests')
@UseGuards(JwtAuthGuard)
export class UserQuestController {
  constructor(
    private readonly getUnlockedChests: GetUnlockedChestsUseCase,
  ) {}

  @Get('chests')
  async getChests(@Request() req: any) {
    return this.getUnlockedChests.execute(req.user.sub);
  }
}
