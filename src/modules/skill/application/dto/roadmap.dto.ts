import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { LearningGoal } from '@prisma/client';
import { MilestoneDto } from './milestone.dto';

export class CreateRoadmapDto {
  @IsString()
  title: string;

  @IsEnum(LearningGoal)
  targetGoal: LearningGoal;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRoadmapDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(LearningGoal)
  targetGoal?: LearningGoal;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class RoadmapDto {
  id: string;
  title: string;
  targetGoal: LearningGoal;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  milestones?: MilestoneDto[];
}
