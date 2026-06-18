import {
  IsString,
  IsBoolean,
  IsArray,
  IsUUID,
  IsNumber,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExerciseResultDto {
  @IsUUID()
  exerciseId: string;

  @IsBoolean()
  isCorrect: boolean;

  @IsNumber()
  incorrectCount: number;

  @IsOptional()
  @IsNumber()
  timeSpentMs?: number;

  @IsOptional()
  @IsNumber()
  timeToFirstActionMs?: number;

  @IsOptional()
  @IsNumber()
  answerChangeCount?: number;
}

export class BehaviorDataDto {
  @IsString()
  exerciseId: string;

  @IsString()
  exerciseType: string;

  @IsNumber()
  timeSpentMs: number;

  @IsNumber()
  timeToFirstActionMs: number;

  @IsNumber()
  answerChangeCount: number;

  @IsBoolean()
  isCorrect: boolean;

  @IsOptional()
  @IsArray()
  answerEvents?: any[];

  @IsOptional()
  @IsString()
  selectedAnswer?: string;

  @IsOptional()
  @IsString()
  correctAnswer?: string;
}

export class SubmitLessonResultDto {
  @IsString()
  lessonId: string;

  @IsString()
  skillId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one exercise result is required' })
  @ValidateNested({ each: true })
  @Type(() => ExerciseResultDto)
  exercises: ExerciseResultDto[];

  @IsOptional()
  @IsNumber()
  timeSpent?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BehaviorDataDto)
  behaviorData?: BehaviorDataDto[];
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
  timeSpent?: number;
}
