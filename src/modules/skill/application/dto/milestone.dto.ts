import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ProficiencyLevel } from '@prisma/client';

export class CreateMilestoneDto {
  @IsString()
  roadmapId: string;

  @IsString()
  title: string;

  @IsEnum(ProficiencyLevel)
  targetLevel: ProficiencyLevel;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsString()
  capstoneTestId?: string;
}

export class UpdateMilestoneDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(ProficiencyLevel)
  targetLevel?: ProficiencyLevel;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsString()
  capstoneTestId?: string;
}

export class MilestoneDto {
  id: string;
  roadmapId: string;
  title: string;
  targetLevel: ProficiencyLevel;
  order: number;
  capstoneTestId: string | null;
}
