import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ExerciseUseCases } from '../../application/usecases/exercise.usecases';
import {
  CreateExerciseDto,
  UpdateExerciseDto,
} from '../../application/dto/exercise.dto';

@Controller('learning/exercises')
export class ExerciseController {
  constructor(private readonly exerciseUseCases: ExerciseUseCases) {}

  @Get(':id')
  async getExerciseById(@Param('id') id: string) {
    return this.exerciseUseCases.getExerciseById(id);
  }

  @Get('lesson/:lessonId')
  async getExercisesByLessonId(@Param('lessonId') lessonId: string) {
    return this.exerciseUseCases.getExercisesByLessonId(lessonId);
  }

  @Get('lesson/:lessonId/count')
  async getExerciseCount(@Param('lessonId') lessonId: string) {
    const count = await this.exerciseUseCases.getExerciseCount(lessonId);
    return { count };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createExercise(@Body() createExerciseDto: CreateExerciseDto) {
    return this.exerciseUseCases.createExercise(createExerciseDto);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  async createManyExercises(@Body() createExerciseDtos: CreateExerciseDto[]) {
    return this.exerciseUseCases.createManyExercises(createExerciseDtos);
  }

  @Put(':id')
  async updateExercise(
    @Param('id') id: string,
    @Body() updateExerciseDto: UpdateExerciseDto,
  ) {
    return this.exerciseUseCases.updateExercise(id, updateExerciseDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExercise(@Param('id') id: string) {
    return this.exerciseUseCases.deleteExercise(id);
  }

  @Delete('lesson/:lessonId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExercisesByLessonId(@Param('lessonId') lessonId: string) {
    return this.exerciseUseCases.deleteExercisesByLessonId(lessonId);
  }
}
