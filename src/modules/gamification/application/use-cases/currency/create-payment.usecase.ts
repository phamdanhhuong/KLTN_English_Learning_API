import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';
import { VnpayService } from '../../services/vnpay.service';

/**
 * Các gói nạp tiền
 */
export const PAYMENT_PACKAGES = {
    gems_50: { name: '50 Gems', price: 20000, gems: 50, coins: 0 },
    gems_150: { name: '150 Gems', price: 50000, gems: 150, coins: 0 },
    gems_500: { name: '500 Gems', price: 150000, gems: 500, coins: 0 },
    coins_500: { name: '500 Coins', price: 10000, gems: 0, coins: 500 },
    coins_2000: { name: '2000 Coins', price: 35000, gems: 0, coins: 2000 },
} as const;

export type PackageId = keyof typeof PAYMENT_PACKAGES;

export interface CreatePaymentResult {
    paymentUrl: string;
    orderId: string;
    orderCode: string;
    amount: number;
    packageName: string;
}

@Injectable()
export class CreatePaymentUseCase {
    constructor(
        private readonly prisma: PrismaService,
        private readonly vnpayService: VnpayService,
    ) {}

    async execute(
        userId: string,
        packageId: string,
        ipAddress: string,
    ): Promise<CreatePaymentResult> {
        // Validate package
        const pkg = PAYMENT_PACKAGES[packageId as PackageId];
        if (!pkg) {
            throw new BadRequestException(
                `Invalid package: ${packageId}. Available: ${Object.keys(PAYMENT_PACKAGES).join(', ')}`,
            );
        }

        // Tạo order code unique (timestamp + random)
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, '0');
        const orderCode = `VR${timestamp}${random}`;

        // Tạo PaymentOrder trong DB
        const order = await this.prisma.paymentOrder.create({
            data: {
                userId,
                orderCode,
                amount: pkg.price,
                gems: pkg.gems,
                coins: pkg.coins,
                status: 'PENDING',
                metadata: {
                    packageId,
                    packageName: pkg.name,
                },
            },
        });

        // Build URL thanh toán VNPay
        const paymentUrl = this.vnpayService.createPaymentUrl({
            orderId: orderCode,
            amount: pkg.price,
            orderInfo: `Nap ${pkg.name} - VocabuRex`,
            ipAddr: ipAddress,
        });

        return {
            paymentUrl,
            orderId: order.id,
            orderCode,
            amount: pkg.price,
            packageName: pkg.name,
        };
    }

    /**
     * Trả danh sách gói nạp
     */
    getPackages() {
        return Object.entries(PAYMENT_PACKAGES).map(([id, pkg]) => ({
            id,
            ...pkg,
        }));
    }
}
