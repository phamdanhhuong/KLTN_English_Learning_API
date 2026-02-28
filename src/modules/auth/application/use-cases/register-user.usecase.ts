import { Inject, Injectable, ConflictException, Logger } from '@nestjs/common';
import { AUTH_TOKENS } from '../../domain/di/tokens';
import { AuthUserRepository } from '../../domain/repositories/auth-user.repository';
import { HashService } from '../../domain/services/hash.service';
import { CacheService } from '../../domain/services/cache.service';
import { UserProfileService } from '../../domain/services/user-profile.service';
import { RegisterDto } from '../dto/register.dto';

@Injectable()
export class RegisterUserUseCase {
  private readonly logger = new Logger(RegisterUserUseCase.name);

  constructor(
    @Inject(AUTH_TOKENS.AUTH_USER_REPOSITORY)
    private readonly authUserRepo: AuthUserRepository,
    @Inject(AUTH_TOKENS.HASH_SERVICE)
    private readonly hashService: HashService,
    @Inject(AUTH_TOKENS.CACHE_SERVICE)
    private readonly cacheService: CacheService,
    @Inject(AUTH_TOKENS.USER_PROFILE_SERVICE)
    private readonly userProfileService: UserProfileService,
  ) {}

  async execute(dto: RegisterDto): Promise<{ message: string }> {
    // Check if email already exists
    const existingUser = await this.authUserRepo.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password and save to cache (TTL 10 minutes)
    const hashedPassword = await this.hashService.hash(dto.password);
    await this.cacheService.set(
      `register:${dto.email}`,
      hashedPassword,
      600, // 10 minutes
    );

    // Send OTP for verification
    await this.userProfileService.sendRegistrationOtp(dto.email);

    return {
      message:
        'OTP sent to your email. Please verify to complete registration.',
    };
  }
}
