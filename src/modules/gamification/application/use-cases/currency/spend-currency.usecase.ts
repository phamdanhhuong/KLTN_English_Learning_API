import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';

export interface SpendCurrencyResult {
    newGems: number;
    newCoins: number;
}

@Injectable()
export class SpendCurrencyUseCase {
    constructor(private readonly prisma: PrismaService) { }

    async execute(
        userId: string,
        amount: number,
        currencyType: 'GEMS' | 'COINS',
        reason: string,
        metadata?: Record<string, any>,
    ): Promise<SpendCurrencyResult> {
        if (amount <= 0) throw new BadRequestException('Amount must be positive');

        return this.prisma.$transaction(async (tx) => {
            // Read-for-update: lấy balance hiện tại trong transaction
            const currency = await tx.userCurrency.findUniqueOrThrow({
                where: { userId },
            });

            // Kiểm tra đủ balance
            if (currencyType === 'GEMS' && currency.gems < amount) {
                throw new BadRequestException(
                    `Insufficient gems: have ${currency.gems}, need ${amount}`,
                );
            }
            if (currencyType === 'COINS' && currency.coins < amount) {
                throw new BadRequestException(
                    `Insufficient coins: have ${currency.coins}, need ${amount}`,
                );
            }

            // Deduct + Log trong cùng transaction
            const [updated] = await Promise.all([
                tx.userCurrency.update({
                    where: { userId },
                    data:
                        currencyType === 'GEMS'
                            ? { gems: { decrement: amount } }
                            : { coins: { decrement: amount } },
                }),
                tx.currencyTransaction.create({
                    data: {
                        userId,
                        currencyType,
                        amount: -amount, // âm = chi tiêu
                        reason: reason as any,
                        metadata,
                    },
                }),
            ]);

            return { newGems: updated.gems, newCoins: updated.coins };
        });
    }
}
