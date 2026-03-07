import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';

// Pricing: 5 gems hoặc 50 coins per energy unit
const ENERGY_GEM_COST = 5;
const ENERGY_COIN_COST = 50;

export interface BuyEnergyResult {
  energyBefore: number;
  energyAfter: number;
  energyPurchased: number;
  costPaid: { currencyType: 'GEMS' | 'COINS'; amount: number };
  remainingCurrency: { gems: number; coins: number };
}

@Injectable()
export class BuyEnergyUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    userId: string,
    energyAmount: number = 1,
    paymentMethod: 'GEMS' | 'COINS' = 'GEMS',
  ): Promise<BuyEnergyResult> {
    if (energyAmount <= 0) throw new BadRequestException('Energy amount must be positive');

    return this.prisma.$transaction(async (tx) => {
      const [energy, currency] = await Promise.all([
        tx.userEnergy.findUniqueOrThrow({ where: { userId } }),
        tx.userCurrency.findUniqueOrThrow({ where: { userId } }),
      ]);

      // Kiểm tra không vượt maxEnergy
      const canAdd = energy.maxEnergy - energy.currentEnergy;
      if (canAdd <= 0) {
        throw new BadRequestException('Energy is already at maximum capacity');
      }

      const actualAmount = Math.min(energyAmount, canAdd);
      const cost = paymentMethod === 'GEMS'
        ? actualAmount * ENERGY_GEM_COST
        : actualAmount * ENERGY_COIN_COST;

      // Kiểm tra đủ tiền
      if (paymentMethod === 'GEMS' && currency.gems < cost) {
        throw new BadRequestException(
          `Insufficient gems: need ${cost}, have ${currency.gems}`,
        );
      }
      if (paymentMethod === 'COINS' && currency.coins < cost) {
        throw new BadRequestException(
          `Insufficient coins: need ${cost}, have ${currency.coins}`,
        );
      }

      // Deduct currency + add energy + log — atomic
      const [updatedCurrency, updatedEnergy] = await Promise.all([
        tx.userCurrency.update({
          where: { userId },
          data: paymentMethod === 'GEMS'
            ? { gems: { decrement: cost } }
            : { coins: { decrement: cost } },
        }),
        tx.userEnergy.update({
          where: { userId },
          data: { currentEnergy: { increment: actualAmount } },
        }),
        tx.currencyTransaction.create({
          data: {
            userId,
            currencyType: paymentMethod,
            amount: -cost,
            reason: 'PURCHASE',
            metadata: { item: 'energy', amount: actualAmount },
          },
        }),
      ]);

      return {
        energyBefore: energy.currentEnergy,
        energyAfter: updatedEnergy.currentEnergy,
        energyPurchased: actualAmount,
        costPaid: { currencyType: paymentMethod, amount: cost },
        remainingCurrency: { gems: updatedCurrency.gems, coins: updatedCurrency.coins },
      };
    });
  }

  /** Trả về pricing để mobile hiển thị trước khi mua */
  getPricing() {
    return {
      gems: ENERGY_GEM_COST,
      coins: ENERGY_COIN_COST,
      unit: 'per energy',
    };
  }
}
