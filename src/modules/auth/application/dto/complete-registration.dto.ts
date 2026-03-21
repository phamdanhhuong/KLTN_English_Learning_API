import { IsString, Length } from 'class-validator';

export class CompleteRegistrationDto {
  @IsString()
  userId: string; // email sent by mobile as "userId"

  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp: string;
}
