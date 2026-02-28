import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import {
  TokenService,
  TokenPayload,
} from '../../domain/services/token.service';

@Injectable()
export class JwtTokenService implements TokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;

  constructor(private readonly configService: ConfigService) {
    this.accessTokenSecret = this.configService.getOrThrow<string>('JWT_SECRET');
    this.refreshTokenSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.accessTokenSecret + '_refresh';
    this.accessTokenExpiresIn =
      this.configService.get<string>('JWT_EXPIRATION') || '1h';
    this.refreshTokenExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';
  }

  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiresIn as any,
    });
  }

  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiresIn as any,
    });
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, this.accessTokenSecret) as TokenPayload;
  }

  verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, this.refreshTokenSecret) as TokenPayload;
  }
}
