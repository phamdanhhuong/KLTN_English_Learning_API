import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';
import { VnpayService } from '../../services/vnpay.service';
import { AddCurrencyUseCase } from './add-currency.usecase';

export interface VnpayIpnResult {
    RspCode: string;
    Message: string;
}

@Injectable()
export class VnpayIpnUseCase {
    private readonly logger = new Logger(VnpayIpnUseCase.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly vnpayService: VnpayService,
        private readonly addCurrencyUseCase: AddCurrencyUseCase,
    ) {}

    async execute(query: Record<string, string>): Promise<VnpayIpnResult> {
        try {
            // 1. Verify checksum
            const verifyResult = this.vnpayService.verifyCallback(query);

            if (!verifyResult.isValid) {
                this.logger.warn(
                    `Invalid checksum for TxnRef: ${verifyResult.vnp_TxnRef}`,
                );
                return { RspCode: '97', Message: 'Invalid signature' };
            }

            // 2. Tìm order theo orderCode (vnp_TxnRef)
            const orderCode = verifyResult.vnp_TxnRef;
            if (!orderCode) {
                return { RspCode: '01', Message: 'Order not found' };
            }

            const order = await this.prisma.paymentOrder.findUnique({
                where: { orderCode },
            });

            if (!order) {
                this.logger.warn(`Order not found: ${orderCode}`);
                return { RspCode: '01', Message: 'Order not found' };
            }

            // 3. Kiểm tra số tiền
            if (
                verifyResult.vnp_Amount !== undefined &&
                verifyResult.vnp_Amount !== order.amount
            ) {
                this.logger.warn(
                    `Amount mismatch for ${orderCode}: expected ${order.amount}, got ${verifyResult.vnp_Amount}`,
                );
                return { RspCode: '04', Message: 'Invalid amount' };
            }

            // 4. Kiểm tra order đã xử lý chưa
            if (order.status !== 'PENDING') {
                this.logger.log(
                    `Order ${orderCode} already processed: ${order.status}`,
                );
                return { RspCode: '02', Message: 'Order already confirmed' };
            }

            // 5. Cập nhật kết quả
            const isSuccess =
                verifyResult.vnp_ResponseCode === '00' &&
                verifyResult.vnp_TransactionStatus === '00';

            if (isSuccess) {
                // Cập nhật order + cộng currency trong transaction
                await this.prisma.$transaction(async (tx) => {
                    // Update order status
                    await tx.paymentOrder.update({
                        where: { id: order.id },
                        data: {
                            status: 'SUCCESS',
                            vnpTransactionNo:
                                verifyResult.vnp_TransactionNo || null,
                            vnpBankCode: verifyResult.vnp_BankCode || null,
                            vnpPayDate: verifyResult.vnp_PayDate || null,
                            vnpResponseCode:
                                verifyResult.vnp_ResponseCode || null,
                        },
                    });
                });

                // Cộng currency cho user (ngoài transaction vì AddCurrencyUseCase tự tạo transaction)
                await this.addCurrencyUseCase.execute(
                    order.userId,
                    order.gems,
                    order.coins,
                    'PURCHASE',
                    {
                        paymentOrderId: order.id,
                        orderCode: order.orderCode,
                        vnpTransactionNo: verifyResult.vnp_TransactionNo,
                    },
                );

                this.logger.log(
                    `✅ Payment success: ${orderCode}, gems: +${order.gems}, coins: +${order.coins}`,
                );
            } else {
                // Thanh toán thất bại
                await this.prisma.paymentOrder.update({
                    where: { id: order.id },
                    data: {
                        status: 'FAILED',
                        vnpTransactionNo:
                            verifyResult.vnp_TransactionNo || null,
                        vnpBankCode: verifyResult.vnp_BankCode || null,
                        vnpPayDate: verifyResult.vnp_PayDate || null,
                        vnpResponseCode:
                            verifyResult.vnp_ResponseCode || null,
                    },
                });

                this.logger.log(
                    `❌ Payment failed: ${orderCode}, responseCode: ${verifyResult.vnp_ResponseCode}`,
                );
            }

            return { RspCode: '00', Message: 'Confirm Success' };
        } catch (error) {
            this.logger.error(`IPN processing error: ${error.message}`, error.stack);
            return { RspCode: '99', Message: 'Unknown error' };
        }
    }
}
