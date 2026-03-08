import {
  IsString,
  IsBoolean,
  IsArray,
  IsUUID,
  IsNumber,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExerciseResultDto {
  @IsUUID()
  exerciseId: string;

  @IsBoolean()
  isCorrect: boolean;

  @IsNumber()
  incorrectCount: number;
}

export class SubmitLessonResultDto {
  @IsUUID()
  lessonId: string;

  @IsUUID()
  skillId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one exercise result is required' })
  @ValidateNested({ each: true })
  @Type(() => ExerciseResultDto)
  exercises: ExerciseResultDto[];
}

export class ProgressUpdateResultDto {
  lessonId: string;
  skillId: string;
  totalExercises: number;
  correctExercises: number;
  accuracy: number;
  wordMasteriesUpdated: number;
  grammarMasteriesUpdated: number;
  isLessonSuccessful: boolean;
  message: string;
  xpEarned?: number;
  bonuses?: {
    baseXP: number;
    bonusXP: number;
    perfectBonusXP: number;
  };
  isPerfect?: boolean;
  rewards?: { type: string; amount: number; title?: string }[];
  skillProgressMessage?: string | null;
  streakData?: {
    previousStreak: number;
    currentStreak: number;
    longestStreak: number;
    hasStreakIncreased: boolean;
  } | null;
}
