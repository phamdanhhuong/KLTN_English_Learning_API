import { Injectable, Logger } from '@nestjs/common';
import { UserProfileService } from '../../../auth/domain/services/user-profile.service';
import { PrismaUserProfileRepository } from '../persistence/prisma-user-profile.repository';
import { CacheServiceImpl } from '../../../auth/infrastructure/services/cache.service.impl';
import { MailService } from '../../../../common/mail/mail.service';

@Injectable()
export class UserProfileServiceImpl implements UserProfileService {
    private readonly logger = new Logger(UserProfileServiceImpl.name);

    constructor(
        private readonly userProfileRepo: PrismaUserProfileRepository,
        private readonly cacheService: CacheServiceImpl,
        private readonly mailService: MailService,
    ) { }

    async createUserProfile(userId: string, email: string): Promise<void> {
        try {
            await this.userProfileRepo.create(userId, email);
            this.logger.log(`User profile created for userId=${userId}`);
        } catch (error) {
            // Nếu gamification records đã tồn tại (idempotent), bỏ qua
            if (error?.code !== 'P2002') throw error;
        }
    }

    async createUserProfileWithDetails(
        userId: string,
        email: string,
        displayName: string,
        avatarUrl?: string,
    ): Promise<void> {
        try {
            await this.userProfileRepo.createWithDetails({
                userId,
                email,
                fullName: displayName,
                profilePictureUrl: avatarUrl,
            });
            this.logger.log(`User profile with details created for userId=${userId}`);
        } catch (error) {
            if (error?.code !== 'P2002') throw error;
        }
    }

    async sendRegistrationOtp(email: string): Promise<void> {
        const otp = this.generateOtp();
        await this.cacheService.set(`otp:register:${email}`, otp, 300); // 5 phút
        await this.mailService.sendOtpEmail(email, otp, 'register');
        this.logger.log(`Registration OTP sent to ${email}`);
    }

    async verifyRegistrationOtp(email: string, otpCode: string): Promise<boolean> {
        const stored = await this.cacheService.get<string>(`otp:register:${email}`);
        if (!stored || stored !== otpCode) return false;
        await this.cacheService.del(`otp:register:${email}`);
        return true;
    }

    async sendPasswordResetOtp(email: string): Promise<void> {
        const otp = this.generateOtp();
        await this.cacheService.set(`otp:reset:${email}`, otp, 300); // 5 phút
        await this.mailService.sendOtpEmail(email, otp, 'reset');
        this.logger.log(`Password reset OTP sent to ${email}`);
    }

    async verifyPasswordResetOtp(email: string, otpCode: string): Promise<boolean> {
        const stored = await this.cacheService.get<string>(`otp:reset:${email}`);
        if (!stored || stored !== otpCode) return false;
        await this.cacheService.del(`otp:reset:${email}`);
        return true;
    }

    private generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
}
