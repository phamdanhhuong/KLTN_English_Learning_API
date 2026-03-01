import { IsString, IsOptional, IsInt, Min } from 'class-validator';

// ========================
// Request DTOs
// ========================

export class CreateSkillDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsString()
  partId?: string;
}

export class UpdateSkillDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsString()
  partId?: string;
}

// ========================
// Response DTOs
// ========================

export class LessonDto {
  id: string;
  skillId: string;
  skillLevel: number;
  title: string;
  position: number;
  createdAt: Date;
}

export class SkillLevelDto {
  skillId: string;
  level: number;
  description: string;
  lessons?: LessonDto[];
}

export class SkillDto {
  id: string;
  title: string;
  description?: string;
  position: number;
  partId?: string;
  createdAt: Date;
  updatedAt: Date;
  levels?: SkillLevelDto[];
}

// ========================
// SkillPart DTOs
// ========================

export class CreateSkillPartDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class UpdateSkillPartDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class SkillPartDto {
  id: string;
  name: string;
  description?: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  skills?: SkillDto[];
}
