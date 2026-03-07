import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';

export interface EnergyStatus {
    currentEnergy: number;
    maxEnergy: number;
    nextRechargeIn: number | null; // Giây đến lần hồi tiếp theo, null nếu full
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

            // Tính thời gian đến lần hồi tiếp
            const nextRechargeIn =
                newEnergy < updated.maxEnergy
                    ? updated.rechargeRateMin * 60 - Math.floor(
                        (new Date().getTime() - newLastRechargeAt.getTime()) / 1000,
                    )
                    : null;

            return {
                currentEnergy: updated.currentEnergy,
                maxEnergy: updated.maxEnergy,
                nextRechargeIn: nextRechargeIn ? Math.max(0, nextRechargeIn) : null,
            };
        });
    }
}

@Injectable()
export class GetEnergyUseCase {
    constructor(private readonly prisma: PrismaService) { }

    async execute(userId: string): Promise<EnergyStatus> {
        const energyRow = await this.prisma.userEnergy.findUnique({ where: { userId } });
        if (!energyRow) {
            return { currentEnergy: 0, maxEnergy: 5, nextRechargeIn: null };
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

        const nextRechargeIn =
            energy < energyRow.maxEnergy
                ? energyRow.rechargeRateMin * 60 -
                Math.floor((new Date().getTime() - newLastRechargeAt.getTime()) / 1000)
                : null;

        return {
            currentEnergy: energy,
            maxEnergy: energyRow.maxEnergy,
            nextRechargeIn: nextRechargeIn ? Math.max(0, nextRechargeIn) : null,
        };
    }
}
