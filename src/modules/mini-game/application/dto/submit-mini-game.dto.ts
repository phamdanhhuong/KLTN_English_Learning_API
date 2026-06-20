import { IsString, IsEnum, IsInt, Min, IsOptional } from 'class-validator';
import { MiniGameType } from '@prisma/client';

export class SubmitMiniGameDto {
  @IsString()
  partId: string;

  @IsEnum(MiniGameType)
  gameType: MiniGameType;

  @IsInt()
  @Min(0)
  score: number;

  @IsInt()
  @Min(0)
  timeSpentMs: number;

  @IsInt()
  @Min(0)
  mistakesCount: number;
}
