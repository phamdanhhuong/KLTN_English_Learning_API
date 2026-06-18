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
  CreateRoadmapDto,
  UpdateRoadmapDto,
} from '../../application/dto/roadmap.dto';
import {
  GetAllRoadmapsUseCase,
  GetRoadmapByIdUseCase,
  CreateRoadmapUseCase,
  UpdateRoadmapUseCase,
  DeleteRoadmapUseCase,
} from '../../application/use-cases/roadmap';

@Controller('learning/roadmaps')
export class RoadmapController {
  constructor(
    private readonly getAllRoadmapsUseCase: GetAllRoadmapsUseCase,
    private readonly getRoadmapByIdUseCase: GetRoadmapByIdUseCase,
    private readonly createRoadmapUseCase: CreateRoadmapUseCase,
    private readonly updateRoadmapUseCase: UpdateRoadmapUseCase,
    private readonly deleteRoadmapUseCase: DeleteRoadmapUseCase,
  ) {}

  @Get()
  async getAllRoadmaps() {
    return this.getAllRoadmapsUseCase.execute();
  }

  @Get(':id')
  async getRoadmapById(@Param('id') id: string) {
    return this.getRoadmapByIdUseCase.execute(id);
  }

  @Post()
  async createRoadmap(@Body() createRoadmapDto: CreateRoadmapDto) {
    return this.createRoadmapUseCase.execute(createRoadmapDto);
  }

  @Put(':id')
  async updateRoadmap(
    @Param('id') id: string,
    @Body() updateRoadmapDto: UpdateRoadmapDto,
  ) {
    return this.updateRoadmapUseCase.execute(id, updateRoadmapDto);
  }

  @Delete(':id')
  async deleteRoadmap(@Param('id') id: string) {
    return this.deleteRoadmapUseCase.execute(id);
  }
}
