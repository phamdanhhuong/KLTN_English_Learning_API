import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';

export interface AwardEnergyRequest {
  userId: string;
  amount: number;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface AwardEnergyResponse {
  userId: string;
  energyBefore: number;
  energyAfter: number;
  energyAdded: number;
  maxEnergy: number;
  success: boolean;
  error?: string;
}

@Injectable()
export class AwardEnergyUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(request: AwardEnergyRequest): Promise<AwardEnergyResponse> {
    const { userId, amount, reason = 'DAILY_BONUS', metadata } = request;

    try {
      if (amount <= 0) {
        return {
          userId,
          energyBefore: 0,
          energyAfter: 0,
          energyAdded: 0,
          maxEnergy: 0,
          success: false,
          error: 'Amount must be positive',
        };
      }

      let userEnergy = await this.prisma.userEnergy.findUnique({
        where: { userId },
      });

      if (!userEnergy) {
        userEnergy = await this.prisma.userEnergy.create({
          data: {
            userId,
            currentEnergy: 0,
            maxEnergy: 5,
            rechargeRateMin: 30,
            lastRechargeAt: new Date(),
          },
        });
      }

      const energyBefore = userEnergy.currentEnergy;
      const newEnergy = Math.min(userEnergy.maxEnergy, energyBefore + amount);
      const energyAdded = newEnergy - energyBefore;

      const updated = await this.prisma.userEnergy.update({
        where: { userId },
        data: { currentEnergy: newEnergy },
      });

      return {
        userId,
        energyBefore,
        energyAfter: updated.currentEnergy,
        energyAdded,
        maxEnergy: updated.maxEnergy,
        success: true,
      };
    } catch (error) {
      return {
        userId,
        energyBefore: 0,
        energyAfter: 0,
        energyAdded: 0,
        maxEnergy: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
