import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class GenerateAiExercisesDto {
  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  difficulty?: string; // beginner | elementary | intermediate | upper_intermediate | advanced

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  exerciseCount?: number;
}

export class GenerateAiExercisesResponseDto {
  lessonId: string;
  lessonTitle: string;
  skillId: string;
  exercises: {
    id: string;
    exerciseType: string;
    prompt?: string;
    meta?: Record<string, any>;
    position: number;
  }[];
}
