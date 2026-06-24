import { IsString, IsOptional, IsEnum, IsBoolean, IsArray, IsNumber } from 'class-validator';
import { LearningGoal, ProficiencyLevel } from '@prisma/client';
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

export class GenerateUserRoadmapDto {
  @IsOptional()
  @IsString()
  targetLanguage?: string;

  @IsOptional()
  @IsEnum(ProficiencyLevel)
  proficiencyLevel?: ProficiencyLevel;

  @IsOptional()
  @IsArray()
  @IsEnum(LearningGoal, { each: true })
  learningGoals?: LearningGoal[];

  @IsOptional()
  @IsNumber()
  dailyGoalMinutes?: number;

  @IsOptional()
  @IsString()
  customPrompt?: string;
}
