import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import {
  CreateExerciseDto,
  UpdateExerciseDto,
} from '../../application/dto/exercise.dto';
import { GenerateAiExercisesDto } from '../../application/dto/generate-ai-exercises.dto';
import {
  GetExerciseByIdUseCase,
  GetExercisesByLessonIdUseCase,
  GetExerciseCountUseCase,
  CreateExerciseUseCase,
  CreateManyExercisesUseCase,
  UpdateExerciseUseCase,
  DeleteExerciseUseCase,
  DeleteExercisesByLessonIdUseCase,
  GetReviewExercisesUseCase,
  GetTrainingExercisesUseCase,
  GenerateAiExercisesUseCase,
} from '../../application/use-cases/exercise';
import { TrainingType } from '../../domain/enums/training-type.enum';

@Controller('learning/exercises')
export class ExerciseController {
  constructor(
    private readonly getExerciseByIdUseCase: GetExerciseByIdUseCase,
    private readonly getExercisesByLessonIdUseCase: GetExercisesByLessonIdUseCase,
    private readonly getExerciseCountUseCase: GetExerciseCountUseCase,
    private readonly createExerciseUseCase: CreateExerciseUseCase,
    private readonly createManyExercisesUseCase: CreateManyExercisesUseCase,
    private readonly updateExerciseUseCase: UpdateExerciseUseCase,
    private readonly deleteExerciseUseCase: DeleteExerciseUseCase,
    private readonly deleteExercisesByLessonIdUseCase: DeleteExercisesByLessonIdUseCase,
    private readonly getReviewExercisesUseCase: GetReviewExercisesUseCase,
    private readonly getTrainingExercisesUseCase: GetTrainingExercisesUseCase,
    private readonly generateAiExercisesUseCase: GenerateAiExercisesUseCase,
  ) {}

  @Get('review')
  @UseGuards(JwtAuthGuard)
  async getReviewExercises(@Req() req: any) {
    return this.getReviewExercisesUseCase.execute(req.user.sub);
  }

  @Get('training')
  @UseGuards(JwtAuthGuard)
  async getTrainingExercises(
    @Req() req: any,
    @Query('type') type?: string,
  ) {
    const trainingType = type && Object.values(TrainingType).includes(type as TrainingType)
      ? (type as TrainingType)
      : undefined;
    return this.getTrainingExercisesUseCase.execute(req.user.sub, trainingType);
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async generateAiExercises(
    @Req() req: any,
    @Body() dto: GenerateAiExercisesDto,
  ) {
    return this.generateAiExercisesUseCase.execute(req.user.sub, dto);
  }

  @Get(':id')
  async getExerciseById(@Param('id') id: string) {
    return this.getExerciseByIdUseCase.execute(id);
  }

  @Get('lesson/:lessonId')
  async getExercisesByLessonId(@Param('lessonId') lessonId: string) {
    return this.getExercisesByLessonIdUseCase.execute(lessonId);
  }

  @Get('lesson/:lessonId/count')
  async getExerciseCount(@Param('lessonId') lessonId: string) {
    const count = await this.getExerciseCountUseCase.execute(lessonId);
    return { count };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createExercise(@Body() createExerciseDto: CreateExerciseDto) {
    return this.createExerciseUseCase.execute(createExerciseDto);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  async createManyExercises(@Body() createExerciseDtos: CreateExerciseDto[]) {
    return this.createManyExercisesUseCase.execute(createExerciseDtos);
  }

  @Put(':id')
  async updateExercise(
    @Param('id') id: string,
    @Body() updateExerciseDto: UpdateExerciseDto,
  ) {
    return this.updateExerciseUseCase.execute(id, updateExerciseDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExercise(@Param('id') id: string) {
    return this.deleteExerciseUseCase.execute(id);
  }

  @Delete('lesson/:lessonId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExercisesByLessonId(@Param('lessonId') lessonId: string) {
    return this.deleteExercisesByLessonIdUseCase.execute(lessonId);
  }
}

