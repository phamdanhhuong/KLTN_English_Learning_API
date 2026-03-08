import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';

export interface EnergyStatus {
    userId: string;
    currentEnergy: number;
    maxEnergy: number;
    energyPercentage: number;
    rechargeInfo: {
        lastRechargeAt: Date;
        nextRechargeAt: Date;
        rechargeRate: number; // Energy per hour
        timeUntilNextRecharge: string; // Human readable
        energyToRecharge: number;
    };
    usage: {
        lastUsedAt: Date | null;
        timeSinceLastUse: string | null;
    };
    pricing: {
        gemCost: number; // Cost per energy in gems
        coinCost: number; // Cost per energy in coins
    };
    transactions?: Array<{
        id: string;
        energyChange: number;
        reason: string;
        createdAt: Date;
        metadata?: any;
    }>;
    success: boolean;
    error?: string;
}

function computeRechargedEnergy(
    current: number,
    max: number,
    lastRechargeAt: Date,
    rechargeRateMin: number,
): { energy: number; newLastRechargeAt: Date } {
    if (current >= max) return { energy: max, newLastRechargeAt: lastRechargeAt };

    const now = new Date();
    const elapsedMin = (now.getTime() - lastRechargeAt.getTime()) / 60000;
    const gained = Math.floor(elapsedMin / rechargeRateMin);

    if (gained <= 0) return { energy: current, newLastRechargeAt: lastRechargeAt };

    const newEnergy = Math.min(current + gained, max);
    // Cập nhật lastRechargeAt theo số energy đã gain
    const newLastRechargeAt = new Date(
        lastRechargeAt.getTime() + gained * rechargeRateMin * 60000,
    );
    return { energy: newEnergy, newLastRechargeAt };
}
function buildEnergyStatus(
    userId: string,
    currentEnergy: number,
    maxEnergy: number,
    lastRechargeAt: Date,
    rechargeRateMin: number,
): EnergyStatus {
    const now = new Date();
    const nextRechargeAt = currentEnergy < maxEnergy
        ? new Date(lastRechargeAt.getTime() + rechargeRateMin * 60000)
        : now;
    const msUntilNext = Math.max(0, nextRechargeAt.getTime() - now.getTime());
    const secsUntilNext = Math.ceil(msUntilNext / 1000);
    const minsUntilNext = Math.floor(secsUntilNext / 60);
    const timeUntilNextRecharge = currentEnergy < maxEnergy
        ? `${minsUntilNext}m ${secsUntilNext % 60}s`
        : 'Full';

    return {
        userId,
        currentEnergy,
        maxEnergy,
        energyPercentage: maxEnergy > 0 ? Math.round((currentEnergy / maxEnergy) * 100) : 0,
        rechargeInfo: {
            lastRechargeAt,
            nextRechargeAt,
            rechargeRate: rechargeRateMin > 0 ? 60 / rechargeRateMin : 0,
            timeUntilNextRecharge,
            energyToRecharge: maxEnergy - currentEnergy,
        },
        usage: {
            lastUsedAt: null,
            timeSinceLastUse: null,
        },
        pricing: {
            gemCost: 10,
            coinCost: 50,
        },
        transactions: [],
        success: true,
    };
}

@Injectable()
export class ConsumeEnergyUseCase {
    constructor(private readonly prisma: PrismaService) { }

    async execute(userId: string, amount: number = 1): Promise<EnergyStatus> {
        if (amount <= 0) throw new BadRequestException('Amount must be positive');

        return this.prisma.$transaction(async (tx) => {
            const energyRow = await tx.userEnergy.findUniqueOrThrow({ where: { userId } });

            // Tính toán auto-recharge trước khi consume
            const { energy: rechargedEnergy, newLastRechargeAt } = computeRechargedEnergy(
                energyRow.currentEnergy,
                energyRow.maxEnergy,
                energyRow.lastRechargeAt,
                energyRow.rechargeRateMin,
            );

            if (rechargedEnergy < amount) {
                throw new BadRequestException(
                    `Không đủ energy: có ${rechargedEnergy}/${energyRow.maxEnergy}`,
                );
            }

            const newEnergy = rechargedEnergy - amount;

            const updated = await tx.userEnergy.update({
                where: { userId },
                data: {
                    currentEnergy: newEnergy,
                    lastRechargeAt: newLastRechargeAt,
                },
            });

            return buildEnergyStatus(
                userId,
                updated.currentEnergy,
                updated.maxEnergy,
                newLastRechargeAt,
                updated.rechargeRateMin,
            );
        });
    }
}

@Injectable()
export class GetEnergyUseCase {
    constructor(private readonly prisma: PrismaService) { }

    async execute(userId: string): Promise<EnergyStatus> {
        const energyRow = await this.prisma.userEnergy.findUnique({ where: { userId } });
        if (!energyRow) {
            return buildEnergyStatus(userId, 0, 5, new Date(), 30);
        }

        const { energy, newLastRechargeAt } = computeRechargedEnergy(
            energyRow.currentEnergy,
            energyRow.maxEnergy,
            energyRow.lastRechargeAt,
            energyRow.rechargeRateMin,
        );

        // Nếu có recharge, persist luôn
        if (energy !== energyRow.currentEnergy) {
            await this.prisma.userEnergy.update({
                where: { userId },
                data: { currentEnergy: energy, lastRechargeAt: newLastRechargeAt },
            });
        }

        return buildEnergyStatus(
            userId,
            energy,
            energyRow.maxEnergy,
            newLastRechargeAt,
            energyRow.rechargeRateMin,
        );
    }
}

