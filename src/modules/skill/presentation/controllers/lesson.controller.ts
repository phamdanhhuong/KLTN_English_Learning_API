import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { LessonUseCases } from '../../application/usecases/lesson.usecases';
import {
  CreateLessonDto,
  UpdateLessonDto,
} from '../../application/dto/lesson.dto';

@Controller('learning/lessons')
export class LessonController {
  constructor(private readonly lessonUseCases: LessonUseCases) {}

  @Get(':id')
  async getLessonById(@Param('id') id: string) {
    return this.lessonUseCases.getLessonById(id);
  }

  @Get('skill/:skillId/level/:level')
  async getLessonsBySkillLevel(
    @Param('skillId') skillId: string,
    @Param('level') level: number,
  ) {
    return this.lessonUseCases.getLessonsBySkillLevel(skillId, +level);
  }

  @Get('skill/:skillId')
  async getLessonsBySkillId(@Param('skillId') skillId: string) {
    return this.lessonUseCases.getLessonsBySkillId(skillId);
  }

  @Post('create')
  async createLesson(@Body() createLessonDto: CreateLessonDto) {
    return this.lessonUseCases.createLesson(createLessonDto);
  }

  @Put('update/:id')
  async updateLesson(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    return this.lessonUseCases.updateLesson(id, updateLessonDto);
  }

  @Delete('delete/:id')
  async deleteLesson(@Param('id') id: string) {
    return this.lessonUseCases.deleteLesson(id);
  }
}
