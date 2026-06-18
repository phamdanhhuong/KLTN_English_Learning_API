import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import {
  GetSkillProgressByUserIdUseCase,
  SubmitLessonResultUseCase,
} from '../../application/use-cases';
import { SubmitLessonResultDto } from '../../application/dto/submit-lesson-result.dto';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(
    private readonly getSkillProgressByUserIdUseCase: GetSkillProgressByUserIdUseCase,
    private readonly submitLessonResultUseCase: SubmitLessonResultUseCase,
    private readonly prisma: PrismaService,
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

  @Get('review-items')
  async getReviewItems(
    @Req() req: any,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.sub;
    const take = Math.min(parseInt(limit || '20', 10), 50);
    const now = new Date();

    const [wordsDue, grammarsDue, learningProfile] = await Promise.all([
      this.prisma.wordMastery.findMany({
        where: {
          userId,
          nextReviewDate: { lte: now },
        },
        include: {
          word: { select: { id: true, content: true, meaning: true, pronunciation: true } },
        },
        orderBy: { nextReviewDate: 'asc' },
        take,
      }),
      this.prisma.grammarMastery.findMany({
        where: {
          userId,
          nextReviewDate: { lte: now },
        },
        include: {
          grammar: { select: { id: true, rule: true, explanation: true } },
        },
        orderBy: { nextReviewDate: 'asc' },
        take,
      }),
      this.prisma.userLearningProfile.findUnique({
        where: { userId },
      }),
    ]);

    const isCalibrated =
      learningProfile != null && learningProfile.totalAnswers >= 50;

    return {
      isCalibrated,
      totalAnswers: learningProfile?.totalAnswers ?? 0,
      calibrationThreshold: 50,
      wordsDue: wordsDue.map((wm: any) => ({
        wordId: wm.wordId,
        content: wm.word.content,
        meaning: wm.word.meaning,
        pronunciation: wm.word.pronunciation,
        masteryLevel: wm.masteryLevel,
        easinessFactor: wm.easinessFactor,
        interval: wm.interval,
        nextReviewDate: wm.nextReviewDate,
      })),
      grammarsDue: grammarsDue.map((gm: any) => ({
        grammarId: gm.grammarId,
        rule: gm.grammar.rule,
        explanation: gm.grammar.explanation,
        masteryLevel: gm.masteryLevel,
        easinessFactor: gm.easinessFactor,
        interval: gm.interval,
        nextReviewDate: gm.nextReviewDate,
      })),
    };
  }
}
