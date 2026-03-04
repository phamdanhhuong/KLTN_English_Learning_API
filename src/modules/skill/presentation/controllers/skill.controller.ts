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
  CreateSkillDto,
  UpdateSkillDto,
} from '../../application/dto/skill.dto';
import {
  GetAllSkillsUseCase,
  GetSkillByIdUseCase,
  CreateSkillUseCase,
  UpdateSkillUseCase,
  DeleteSkillUseCase,
  ValidateSkillStructureUseCase,
} from '../../application/use-cases/skill';

@Controller('learning/skills')
export class SkillController {
  constructor(
    private readonly getAllSkillsUseCase: GetAllSkillsUseCase,
    private readonly getSkillByIdUseCase: GetSkillByIdUseCase,
    private readonly createSkillUseCase: CreateSkillUseCase,
    private readonly updateSkillUseCase: UpdateSkillUseCase,
    private readonly deleteSkillUseCase: DeleteSkillUseCase,
    private readonly validateSkillStructureUseCase: ValidateSkillStructureUseCase,
  ) {}

  @Get()
  async getAllSkills() {
    return this.getAllSkillsUseCase.execute();
  }

  @Get(':id')
  async getSkillById(@Param('id') id: string) {
    return this.getSkillByIdUseCase.execute(id);
  }

  @Post()
  async createSkill(@Body() createSkillDto: CreateSkillDto) {
    return this.createSkillUseCase.execute(createSkillDto);
  }

  @Put(':id')
  async updateSkill(
    @Param('id') id: string,
    @Body() updateSkillDto: UpdateSkillDto,
  ) {
    return this.updateSkillUseCase.execute(id, updateSkillDto);
  }

  @Delete(':id')
  async deleteSkill(@Param('id') id: string) {
    return this.deleteSkillUseCase.execute(id);
  }

  @Get(':id/validate')
  async validateSkillStructure(@Param('id') id: string) {
    return this.validateSkillStructureUseCase.execute(id);
  }
}
