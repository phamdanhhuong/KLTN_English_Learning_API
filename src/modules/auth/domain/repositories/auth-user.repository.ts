import { AuthUser } from '../entities/auth-user.entity';

export interface CreateAuthUserData {
  email: string;
  password?: string;
  roleId: string;
  googleId?: string;
  facebookId?: string;
  isEmailVerified?: boolean;
  // Onboarding profile fields
  fullName?: string;
  profilePictureUrl?: string;
  dateOfBirth?: Date;
  gender?: string;
  nativeLanguage?: string;
  targetLanguage?: string;
  proficiencyLevel?: string;
  learningGoals?: string[];
  dailyGoalMinutes?: number;
  timezone?: string;
}

export interface AuthUserRepository {
  findById(id: string): Promise<AuthUser | null>;
  findByEmail(email: string): Promise<AuthUser | null>;
  findByGoogleId(googleId: string): Promise<AuthUser | null>;
  findByFacebookId(facebookId: string): Promise<AuthUser | null>;
  create(data: CreateAuthUserData): Promise<AuthUser>;
  update(id: string, data: Partial<AuthUser>): Promise<AuthUser>;
  delete(id: string): Promise<void>;
}
