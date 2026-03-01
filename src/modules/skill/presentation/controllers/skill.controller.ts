import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { SkillUseCases } from '../../application/usecases/skill.usecases';
import {
  CreateSkillDto,
  UpdateSkillDto,
} from '../../application/dto/skill.dto';

@Controller('learning/skills')
export class SkillController {
  constructor(private readonly skillUseCases: SkillUseCases) {}

  @Get()
  async getAllSkills() {
    return this.skillUseCases.getAllSkills();
  }

  @Get('get/:id')
  async getSkillById(@Param('id') id: string) {
    return this.skillUseCases.getSkillById(id);
  }

  @Post('create')
  async createSkill(@Body() createSkillDto: CreateSkillDto) {
    return this.skillUseCases.createSkill(createSkillDto);
  }

  @Put('update/:id')
  async updateSkill(
    @Param('id') id: string,
    @Body() updateSkillDto: UpdateSkillDto,
  ) {
    return this.skillUseCases.updateSkill(id, updateSkillDto);
  }

  @Delete('delete/:id')
  async deleteSkill(@Param('id') id: string) {
    return this.skillUseCases.deleteSkill(id);
  }

  @Get('validate/:id')
  async validateSkillStructure(@Param('id') id: string) {
    return this.skillUseCases.validateSkillStructure(id);
  }
}
