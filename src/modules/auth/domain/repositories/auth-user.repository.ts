import { AuthUser } from '../entities/auth-user.entity';

export interface AuthUserRepository {
  findById(id: string): Promise<AuthUser | null>;
  findByEmail(email: string): Promise<AuthUser | null>;
  findByGoogleId(googleId: string): Promise<AuthUser | null>;
  findByFacebookId(facebookId: string): Promise<AuthUser | null>;
  create(data: {
    email: string;
    password?: string;
    roleId: string;
    googleId?: string;
    facebookId?: string;
    isEmailVerified?: boolean;
  }): Promise<AuthUser>;
  update(id: string, data: Partial<AuthUser>): Promise<AuthUser>;
  delete(id: string): Promise<void>;
}
