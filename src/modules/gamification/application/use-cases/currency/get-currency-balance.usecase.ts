import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';

export interface CurrencyBalance {
  gems: number;
  coins: number;
}

@Injectable()
export class GetCurrencyBalanceUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string): Promise<CurrencyBalance> {
    const currency = await this.prisma.userCurrency.findUnique({ where: { userId } });
    if (!currency) return { gems: 0, coins: 0 };
    return { gems: currency.gems, coins: currency.coins };
  }
}
