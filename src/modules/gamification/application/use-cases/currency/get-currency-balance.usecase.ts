import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';

export enum CurrencyType {
  GEMS = 'GEMS',
  COINS = 'COINS',
}

export interface CurrencyBalance {
  userId: string;
  gems: number;
  coins: number;
  lastUpdated: Date;
  totalEarned?: {
    gems: number;
    coins: number;
  };
  totalSpent?: {
    gems: number;
    coins: number;
  };
  recentTransactions?: Array<{
    id: string;
    currencyType: CurrencyType;
    amount: number;
    reason: string;
    description?: string;
    createdAt: Date;
  }>;
}

@Injectable()
export class GetCurrencyBalanceUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string): Promise<CurrencyBalance> {
    const [currency, recentTx] = await Promise.all([
      this.prisma.userCurrency.findUnique({ where: { userId } }),
      this.prisma.currencyTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      userId,
      gems: currency?.gems ?? 0,
      coins: currency?.coins ?? 0,
      lastUpdated: currency?.updatedAt ?? new Date(),
      totalEarned: { gems: 0, coins: 0 },
      totalSpent: { gems: 0, coins: 0 },
      recentTransactions: recentTx.map(tx => ({
        id: tx.id,
        currencyType: tx.currencyType as CurrencyType,
        amount: tx.amount,
        reason: tx.reason,
        description: tx.metadata ? String(tx.metadata) : undefined,
        createdAt: tx.createdAt,
      })),
    };
  }
}
