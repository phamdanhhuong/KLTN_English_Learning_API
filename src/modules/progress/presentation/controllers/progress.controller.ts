import { Controller, Get, Param } from '@nestjs/common';
import { GetSkillProgressByUserIdUseCase } from '../../application/use-cases';

@Controller('progress')
export class ProgressController {
  constructor(
    private readonly getSkillProgressByUserIdUseCase: GetSkillProgressByUserIdUseCase,
  ) {}

  @Get('skill/:userId')
  async getSkillProgress(@Param('userId') userId: string) {
    return this.getSkillProgressByUserIdUseCase.execute(userId);
  }
}
