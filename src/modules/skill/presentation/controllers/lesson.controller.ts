import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import {
  CreateLessonDto,
  UpdateLessonDto,
} from '../../application/dto/lesson.dto';
import {
  GetLessonByIdUseCase,
  GetLessonsBySkillLevelUseCase,
  GetLessonsBySkillIdUseCase,
  CreateLessonUseCase,
  UpdateLessonUseCase,
  DeleteLessonUseCase,
} from '../../application/use-cases/lesson';

@Controller('learning/lessons')
export class LessonController {
  constructor(
    private readonly getLessonByIdUseCase: GetLessonByIdUseCase,
    private readonly getLessonsBySkillLevelUseCase: GetLessonsBySkillLevelUseCase,
    private readonly getLessonsBySkillIdUseCase: GetLessonsBySkillIdUseCase,
    private readonly createLessonUseCase: CreateLessonUseCase,
    private readonly updateLessonUseCase: UpdateLessonUseCase,
    private readonly deleteLessonUseCase: DeleteLessonUseCase,
  ) {}

  @Get(':id')
  async getLessonById(@Param('id') id: string) {
    return this.getLessonByIdUseCase.execute(id);
  }

  @Get('skill/:skillId/level/:level')
  async getLessonsBySkillLevel(
    @Param('skillId') skillId: string,
    @Param('level') level: number,
  ) {
    return this.getLessonsBySkillLevelUseCase.execute(skillId, +level);
  }

  @Get('skill/:skillId')
  async getLessonsBySkillId(@Param('skillId') skillId: string) {
    return this.getLessonsBySkillIdUseCase.execute(skillId);
  }

  @Post()
  async createLesson(@Body() createLessonDto: CreateLessonDto) {
    return this.createLessonUseCase.execute(createLessonDto);
  }

  @Put(':id')
  async updateLesson(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    return this.updateLessonUseCase.execute(id, updateLessonDto);
  }

  @Delete(':id')
  async deleteLesson(@Param('id') id: string) {
    return this.deleteLessonUseCase.execute(id);
  }
}
