import { Controller, Get, Post, Body, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { GetSkillProgressByUserIdUseCase, SubmitLessonResultUseCase } from '../../application/use-cases';
import { SubmitLessonResultDto } from '../../application/dto/submit-lesson-result.dto';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(
    private readonly getSkillProgressByUserIdUseCase: GetSkillProgressByUserIdUseCase,
    private readonly submitLessonResultUseCase: SubmitLessonResultUseCase,
  ) {}

  @Get('skill')
  async getSkillProgress(@Req() req: any) {
    return this.getSkillProgressByUserIdUseCase.execute(req.user.sub);
  }

  @Post('submit-lesson')
  @UsePipes(new ValidationPipe({ transform: true }))
  async submitLessonResult(
    @Req() req: any,
    @Body() submitDto: SubmitLessonResultDto,
  ) {
    return this.submitLessonResultUseCase.execute(req.user.sub, submitDto);
  }
}

