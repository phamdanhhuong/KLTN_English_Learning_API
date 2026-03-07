import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';

export interface AddCurrencyResult {
    newGems: number;
    newCoins: number;
}

@Injectable()
export class AddCurrencyUseCase {
    constructor(private readonly prisma: PrismaService) { }

    async execute(
        userId: string,
        gems: number,
        coins: number,
        reason: string,
        metadata?: Record<string, any>,
    ): Promise<AddCurrencyResult> {
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.userCurrency.update({
                where: { userId },
                data: {
                    ...(gems > 0 ? { gems: { increment: gems } } : {}),
                    ...(coins > 0 ? { coins: { increment: coins } } : {}),
                },
            });

            // Log từng loại currency — type-safe
            const logs: Promise<any>[] = [];
            if (gems > 0) {
                logs.push(
                    tx.currencyTransaction.create({
                        data: {
                            userId,
                            currencyType: 'GEMS',
                            amount: gems,
                            reason: reason as any,
                            metadata,
                        },
                    }),
                );
            }
            if (coins > 0) {
                logs.push(
                    tx.currencyTransaction.create({
                        data: {
                            userId,
                            currencyType: 'COINS',
                            amount: coins,
                            reason: reason as any,
                            metadata,
                        },
                    }),
                );
            }
            if (logs.length > 0) await Promise.all(logs);

            return { newGems: updated.gems, newCoins: updated.coins };
        });
    }
}
