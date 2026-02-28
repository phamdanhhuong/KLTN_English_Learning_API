import {
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AUTH_TOKENS } from '../../domain/di/tokens';
import { AuthUserRepository } from '../../domain/repositories/auth-user.repository';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { HashService } from '../../domain/services/hash.service';
import { TokenService, TokenPair } from '../../domain/services/token.service';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(AUTH_TOKENS.AUTH_USER_REPOSITORY)
    private readonly authUserRepo: AuthUserRepository,
    @Inject(AUTH_TOKENS.HASH_SERVICE)
    private readonly hashService: HashService,
    @Inject(AUTH_TOKENS.TOKEN_SERVICE)
    private readonly tokenService: TokenService,
    @Inject(AUTH_TOKENS.REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: RefreshTokenRepository,
  ) {}

  async execute(
    dto: LoginDto,
  ): Promise<{ tokens: TokenPair; user: { id: string; email: string; role: string } }> {
    const user = await this.authUserRepo.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'This account uses social login. Please use Google or Facebook to sign in.',
      );
    }

    const isPasswordValid = await this.hashService.compare(
      dto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.authUserRepo.update(user.id, { lastLoginAt: new Date() });

    const roleName = user.role?.name || 'USER';
    const payload = { sub: user.id, email: user.email, role: roleName };

    const tokens: TokenPair = {
      accessToken: this.tokenService.generateAccessToken(payload),
      refreshToken: this.tokenService.generateRefreshToken(payload),
    };

    // Save refresh token
    await this.refreshTokenRepo.create({
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      tokens,
      user: { id: user.id, email: user.email, role: roleName },
    };
  }
}
