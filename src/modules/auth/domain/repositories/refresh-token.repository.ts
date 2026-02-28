import { RefreshToken } from '../entities/refresh-token.entity';

export interface RefreshTokenRepository {
  create(data: {
    token: string;
    userId: string;
    expiresAt: Date;
  }): Promise<RefreshToken>;
  findByToken(token: string): Promise<RefreshToken | null>;
  revokeByUserId(userId: string): Promise<void>;
  revokeByToken(token: string): Promise<void>;
  deleteExpiredTokens(): Promise<number>;
}
