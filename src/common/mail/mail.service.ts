import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(private readonly mailerService: MailerService) { }

    async sendOtpEmail(
        email: string,
        otpCode: string,
        type: 'register' | 'reset',
    ): Promise<void> {
        const subject =
            type === 'register'
                ? 'Xác minh email đăng ký — KLTN English Learning'
                : 'Đặt lại mật khẩu — KLTN English Learning';

        const template = type === 'register' ? 'otp-register' : 'otp-reset';

        try {
            await this.mailerService.sendMail({
                to: email,
                subject,
                template,
                context: {
                    otpCode,
                    expireMinutes: 5,
                    email,
                    year: new Date().getFullYear(),
                },
            });
            this.logger.log(`OTP email (${type}) sent to ${email}`);
        } catch (error) {
            this.logger.error(
                `Failed to send OTP email to ${email}: ${error.message}`,
            );
            throw error;
        }
    }

    async sendWelcomeEmail(email: string, fullName?: string): Promise<void> {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Chào mừng đến với KLTN English Learning!',
                template: 'welcome',
                context: {
                    fullName: fullName || email.split('@')[0],
                    email,
                    year: new Date().getFullYear(),
                },
            });
            this.logger.log(`Welcome email sent to ${email}`);
        } catch (error) {
            this.logger.warn(`Failed to send welcome email to ${email}: ${error.message}`);
            // Không throw — welcome email không critical
        }
    }
}
