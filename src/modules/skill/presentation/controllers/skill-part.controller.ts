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
import { SkillPartUseCases } from '../../application/usecases/skill-part.usecases';
import {
  CreateSkillPartDto,
  UpdateSkillPartDto,
} from '../../application/dto/skill.dto';

@Controller('learning/skill-parts')
export class SkillPartController {
  constructor(private readonly skillPartUseCases: SkillPartUseCases) {}

  @Get()
  async getAllSkillParts() {
    return this.skillPartUseCases.getAllSkillParts();
  }

  @Get(':id')
  async getSkillPartById(@Param('id') id: string) {
    return this.skillPartUseCases.getSkillPartById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSkillPart(@Body() createSkillPartDto: CreateSkillPartDto) {
    return this.skillPartUseCases.createSkillPart(createSkillPartDto);
  }

  @Put(':id')
  async updateSkillPart(
    @Param('id') id: string,
    @Body() updateSkillPartDto: UpdateSkillPartDto,
  ) {
    return this.skillPartUseCases.updateSkillPart(id, updateSkillPartDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSkillPart(@Param('id') id: string) {
    return this.skillPartUseCases.deleteSkillPart(id);
  }
}
