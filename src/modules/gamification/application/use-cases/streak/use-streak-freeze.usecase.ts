import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';

const STREAK_FREEZE_COST_GEMS = 50;

@Injectable()
export class UseStreakFreezeUseCase {
    constructor(private readonly prisma: PrismaService) { }

    async execute(userId: string): Promise<{ freezeCount: number; newGems: number }> {
        return this.prisma.$transaction(async (tx) => {
            const [currency, streak] = await Promise.all([
                tx.userCurrency.findUniqueOrThrow({ where: { userId } }),
                tx.streakData.findUnique({ where: { userId } }),
            ]);

            if (currency.gems < STREAK_FREEZE_COST_GEMS) {
                throw new BadRequestException(
                    `Không đủ gems: cần ${STREAK_FREEZE_COST_GEMS}, có ${currency.gems}`,
                );
            }

            // Mua freeze: trừ gems + tăng freezeCount
            const [updatedCurrency, updatedStreak] = await Promise.all([
                tx.userCurrency.update({
                    where: { userId },
                    data: { gems: { decrement: STREAK_FREEZE_COST_GEMS } },
                }),
                tx.streakData.update({
                    where: { userId },
                    data: { freezeCount: { increment: 1 } },
                }),
                tx.currencyTransaction.create({
                    data: {
                        userId,
                        currencyType: 'GEMS',
                        amount: -STREAK_FREEZE_COST_GEMS,
                        reason: 'PURCHASE',
                        metadata: { item: 'streak_freeze' },
                    },
                }),
            ]);

            return {
                freezeCount: updatedStreak.freezeCount,
                newGems: updatedCurrency.gems,
            };
        });
    }
}
