import { Injectable, Logger } from '@nestjs/common';
import { LearningService } from '../../domain/services/learning.service';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

/**
 * Real implementation tạm thời cho LearningService.
 *
 * Khi LearningModule được build (Phase 2), thay bằng lời gọi trực tiếp:
 *   await this.progressService.createInitialProgress(userId);
 *
 * Hiện tại: Tạo bản ghi settings mặc định cho user mới
 * trên các bảng có sẵn, không fail quá trình đăng ký/login.
 */
@Injectable()
export class LearningServiceImpl implements LearningService {
  private readonly logger = new Logger(LearningServiceImpl.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Được gọi sau khi user đăng ký thành công hoặc login Google/Facebook lần đầu.
   * Mục đích: chuẩn bị dữ liệu học tập ban đầu cho user.
   *
   * Phase 1: Chỉ đảm bảo gamification records đã tồn tại (idempotent).
   * Phase 2: Tạo UserSkillProgress, UserLessonProgress records ban đầu.
   */
  async initializeLearningProfile(userId: string): Promise<void> {
    try {
      // Đảm bảo gamification records tồn tại (idempotent, không lỗi nếu đã có)
      await this.prisma.$transaction([
        this.prisma.userCurrency.upsert({
          where: { userId },
          update: {},
          create: { userId },
        }),
        this.prisma.streakData.upsert({
          where: { userId },
          update: {},
          create: { userId },
        }),
        this.prisma.userEnergy.upsert({
          where: { userId },
          update: {},
          create: { userId },
        }),
      ]);

      this.logger.log(`Learning profile initialized for userId=${userId}`);
    } catch (error: any) {
      // Không throw — không để lỗi init learning profile block quá trình đăng ký
      this.logger.error(
        `Failed to initialize learning profile for userId=${userId}: ${error.message}`,
      );
    }
  }
}
