import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsObject,
} from 'class-validator';
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

export class CreateExerciseDto {
  @IsString()
  lessonId: string;

  @IsEnum(ExerciseTypeDto)
  exerciseType: ExerciseTypeDto;

  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsObject()
  meta?: ExerciseMeta;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class UpdateExerciseDto {
  @IsOptional()
  @IsEnum(ExerciseTypeDto)
  exerciseType?: ExerciseTypeDto;

  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsObject()
  meta?: ExerciseMeta;

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
  meta?: ExerciseMeta;
  position: number;
  createdAt: Date;
  isInteractive: boolean;
  isContentBased: boolean;
}
