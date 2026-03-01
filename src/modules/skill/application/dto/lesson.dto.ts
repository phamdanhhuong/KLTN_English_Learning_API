import { IsString, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import type { ExerciseMeta } from './meta.dto';

export enum ExerciseTypeDto {
  TRANSLATE = 'translate',
  LISTEN_CHOOSE = 'listen_choose',
  FILL_BLANK = 'fill_blank',
  SPEAK = 'speak',
  MATCH = 'match',
  MULTIPLE_CHOICE = 'multiple_choice',
  WRITING_PROMPT = 'writing_prompt',
  IMAGE_DESCRIPTION = 'image_description',
  READ_COMPREHENSION = 'read_comprehension',
  PODCAST = 'podcast',
  COMPARE_WORDS = 'compare_words',
  PRONUNCIATION_VOWEL = 'pronunciation_vowel',
  PRONUNCIATION_CONSONANT = 'pronunciation_consonant',
  PRONUNCIATION_WORD = 'pronunciation_word',
}

// ========================
// Request DTOs
// ========================

export class CreateLessonDto {
  @IsString()
  skillId: string;

  @IsInt()
  @Min(1)
  skillLevel: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class CreateExerciseInLessonDto {
  @IsString()
  lessonId: string;

  @IsEnum(ExerciseTypeDto)
  exerciseType: ExerciseTypeDto;

  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  meta?: Record<string, any>;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

// ========================
// Response DTOs
// ========================

export class ExerciseDto {
  id: string;
  lessonId: string;
  exerciseType: ExerciseTypeDto;
  prompt?: string;
  meta?: Record<string, any>;
  position: number;
  createdAt: Date;
  isInteractive: boolean;
  isContentBased: boolean;
}

export class LessonDto {
  id: string;
  skillId: string;
  skillLevel: number;
  title: string;
  position: number;
  createdAt: Date;
  exercises?: ExerciseDto[];
  exerciseCount: number;
}

export class LessonOverviewDto {
  totalLessons: number;
  completedLessons: number;
  currentLesson?: LessonDto;
}
