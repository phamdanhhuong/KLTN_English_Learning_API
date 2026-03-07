import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { GetSkillProgressByUserIdUseCase } from '../../application/use-cases';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(
    private readonly getSkillProgressByUserIdUseCase: GetSkillProgressByUserIdUseCase,
  ) {}

  @Get('skill')
  async getSkillProgress(@Req() req: any) {
    return this.getSkillProgressByUserIdUseCase.execute(req.user.sub);
  }
}
