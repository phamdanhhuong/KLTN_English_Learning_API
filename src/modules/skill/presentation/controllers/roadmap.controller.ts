import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import {
  CreateRoadmapDto,
  UpdateRoadmapDto,
  GenerateUserRoadmapDto,
} from '../../application/dto/roadmap.dto';
import {
  GetAllRoadmapsUseCase,
  GetRoadmapByIdUseCase,
  CreateRoadmapUseCase,
  UpdateRoadmapUseCase,
  DeleteRoadmapUseCase,
  GetActiveUserRoadmapUseCase,
  GenerateUserRoadmapUseCase,
  GetUserRoadmapHistoryUseCase,
  SwitchUserRoadmapUseCase,
} from '../../application/use-cases/roadmap';

@Controller('learning/roadmaps')
export class RoadmapController {
  constructor(
    private readonly getAllRoadmapsUseCase: GetAllRoadmapsUseCase,
    private readonly getRoadmapByIdUseCase: GetRoadmapByIdUseCase,
    private readonly createRoadmapUseCase: CreateRoadmapUseCase,
    private readonly updateRoadmapUseCase: UpdateRoadmapUseCase,
    private readonly deleteRoadmapUseCase: DeleteRoadmapUseCase,
    private readonly getActiveUserRoadmapUseCase: GetActiveUserRoadmapUseCase,
    private readonly generateUserRoadmapUseCase: GenerateUserRoadmapUseCase,
    private readonly getUserRoadmapHistoryUseCase: GetUserRoadmapHistoryUseCase,
    private readonly switchUserRoadmapUseCase: SwitchUserRoadmapUseCase,
  ) {}

  @Get()
  async getAllRoadmaps() {
    return this.getAllRoadmapsUseCase.execute();
  }

  @Get('user/active')
  @UseGuards(JwtAuthGuard)
  async getActiveUserRoadmap(@Req() req: any) {
    return this.getActiveUserRoadmapUseCase.execute(req.user.sub);
  }

  @Post('user/generate')
  @UseGuards(JwtAuthGuard)
  async generateUserRoadmap(@Req() req: any, @Body() dto: GenerateUserRoadmapDto) {
    return this.generateUserRoadmapUseCase.execute(req.user.sub, dto);
  }

  @Get('user/history')
  @UseGuards(JwtAuthGuard)
  async getUserRoadmapHistory(@Req() req: any) {
    return this.getUserRoadmapHistoryUseCase.execute(req.user.sub);
  }

  @Post('user/switch/:roadmapId')
  @UseGuards(JwtAuthGuard)
  async switchUserRoadmap(@Req() req: any, @Param('roadmapId') roadmapId: string) {
    return this.switchUserRoadmapUseCase.execute(req.user.sub, roadmapId);
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
