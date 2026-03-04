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
import {
  CreateSkillPartDto,
  UpdateSkillPartDto,
} from '../../application/dto/skill.dto';
import {
  GetAllSkillPartsUseCase,
  GetSkillPartByIdUseCase,
  CreateSkillPartUseCase,
  UpdateSkillPartUseCase,
  DeleteSkillPartUseCase,
} from '../../application/use-cases/skill-part';

@Controller('learning/skill-parts')
export class SkillPartController {
  constructor(
    private readonly getAllSkillPartsUseCase: GetAllSkillPartsUseCase,
    private readonly getSkillPartByIdUseCase: GetSkillPartByIdUseCase,
    private readonly createSkillPartUseCase: CreateSkillPartUseCase,
    private readonly updateSkillPartUseCase: UpdateSkillPartUseCase,
    private readonly deleteSkillPartUseCase: DeleteSkillPartUseCase,
  ) {}

  @Get()
  async getAllSkillParts() {
    return this.getAllSkillPartsUseCase.execute();
  }

  @Get(':id')
  async getSkillPartById(@Param('id') id: string) {
    return this.getSkillPartByIdUseCase.execute(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSkillPart(@Body() createSkillPartDto: CreateSkillPartDto) {
    return this.createSkillPartUseCase.execute(createSkillPartDto);
  }

  @Put(':id')
  async updateSkillPart(
    @Param('id') id: string,
    @Body() updateSkillPartDto: UpdateSkillPartDto,
  ) {
    return this.updateSkillPartUseCase.execute(id, updateSkillPartDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSkillPart(@Param('id') id: string) {
    return this.deleteSkillPartUseCase.execute(id);
  }
}
