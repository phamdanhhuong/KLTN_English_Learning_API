import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  IsOptional,
  IsArray,
  IsInt,
  IsIn,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  // ==================== Onboarding fields (optional) ====================

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  profilePictureUrl?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @IsIn(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])
  gender?: string;

  @IsOptional()
  @IsString()
  nativeLanguage?: string;

  @IsOptional()
  @IsString()
  targetLanguage?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'BEGINNER',
    'ELEMENTARY',
    'INTERMEDIATE',
    'UPPER_INTERMEDIATE',
    'ADVANCED',
    'PROFICIENT',
  ])
  proficiencyLevel?: string;

  @IsOptional()
  @IsArray()
  learningGoals?: string[];

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  dailyGoalMinutes?: number;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  studyReminder?: string;

  @IsOptional()
  @IsString()
  reminderTime?: string;
}
