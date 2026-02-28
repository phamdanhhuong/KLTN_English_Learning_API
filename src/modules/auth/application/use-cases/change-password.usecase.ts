import {
  Inject,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AUTH_TOKENS } from '../../domain/di/tokens';
import { AuthUserRepository } from '../../domain/repositories/auth-user.repository';
import { HashService } from '../../domain/services/hash.service';
import { ChangePasswordDto } from '../dto/password.dto';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(AUTH_TOKENS.AUTH_USER_REPOSITORY)
    private readonly authUserRepo: AuthUserRepository,
    @Inject(AUTH_TOKENS.HASH_SERVICE)
    private readonly hashService: HashService,
  ) {}

  async execute(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.authUserRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.password) {
      throw new BadRequestException(
        'Cannot change password for social login account',
      );
    }

    const isCurrentPasswordValid = await this.hashService.compare(
      dto.currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const hashedNewPassword = await this.hashService.hash(dto.newPassword);
    await this.authUserRepo.update(userId, { password: hashedNewPassword });

    return { message: 'Password changed successfully' };
  }
}
