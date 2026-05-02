import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class DeleteAccountUseCase {
  private readonly logger = new Logger(DeleteAccountUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Hard delete user. Prisma's cascade delete should handle most relations.
      await this.prisma.user.delete({
        where: { id: userId },
      });

      this.logger.log(`User ${userId} deleted successfully`);
      return { success: true, message: 'Account deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting user ${userId}: ${error.message}`);
      throw error;
    }
  }
}
