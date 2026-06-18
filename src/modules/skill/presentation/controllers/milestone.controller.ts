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
  CreateMilestoneDto,
  UpdateMilestoneDto,
} from '../../application/dto/milestone.dto';
import {
  GetMilestonesByRoadmapUseCase,
  GetMilestoneByIdUseCase,
  CreateMilestoneUseCase,
  UpdateMilestoneUseCase,
  DeleteMilestoneUseCase,
} from '../../application/use-cases/milestone';

@Controller('learning/milestones')
export class MilestoneController {
  constructor(
    private readonly getMilestonesByRoadmapUseCase: GetMilestonesByRoadmapUseCase,
    private readonly getMilestoneByIdUseCase: GetMilestoneByIdUseCase,
    private readonly createMilestoneUseCase: CreateMilestoneUseCase,
    private readonly updateMilestoneUseCase: UpdateMilestoneUseCase,
    private readonly deleteMilestoneUseCase: DeleteMilestoneUseCase,
  ) {}

  @Get('roadmap/:roadmapId')
  async getMilestonesByRoadmap(@Param('roadmapId') roadmapId: string) {
    return this.getMilestonesByRoadmapUseCase.execute(roadmapId);
  }

  @Get(':id')
  async getMilestoneById(@Param('id') id: string) {
    return this.getMilestoneByIdUseCase.execute(id);
  }

  @Post()
  async createMilestone(@Body() createMilestoneDto: CreateMilestoneDto) {
    return this.createMilestoneUseCase.execute(createMilestoneDto);
  }

  @Put(':id')
  async updateMilestone(
    @Param('id') id: string,
    @Body() updateMilestoneDto: UpdateMilestoneDto,
  ) {
    return this.updateMilestoneUseCase.execute(id, updateMilestoneDto);
  }

  @Delete(':id')
  async deleteMilestone(@Param('id') id: string) {
    return this.deleteMilestoneUseCase.execute(id);
  }
}
