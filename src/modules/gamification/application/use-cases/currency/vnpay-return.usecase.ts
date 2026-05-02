import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';
import { VnpayService } from '../../services/vnpay.service';
import { AddCurrencyUseCase } from './add-currency.usecase';

export interface VnpayReturnResult {
    success: boolean;
    message: string;
    orderCode?: string;
    amount?: number;
    transactionNo?: string;
    bankCode?: string;
    payDate?: string;
    responseCode?: string;
    gems?: number;
    coins?: number;
}

@Injectable()
export class VnpayReturnUseCase {
    private readonly logger = new Logger(VnpayReturnUseCase.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly vnpayService: VnpayService,
        private readonly addCurrencyUseCase: AddCurrencyUseCase,
    ) {}

    async execute(query: Record<string, string>): Promise<VnpayReturnResult> {
        // Verify checksum
        const verifyResult = this.vnpayService.verifyCallback(query);

        if (!verifyResult.isValid) {
            return {
                success: false,
                message: 'Chữ ký không hợp lệ',
            };
        }

        const isSuccess =
            verifyResult.vnp_ResponseCode === '00' &&
            verifyResult.vnp_TransactionStatus === '00';

        // Lấy thông tin order
        let order: any = null;
        if (verifyResult.vnp_TxnRef) {
            order = await this.prisma.paymentOrder.findUnique({
                where: { orderCode: verifyResult.vnp_TxnRef },
            });
        }

        // Fallback: Nếu IPN chưa xử lý (order vẫn PENDING) → xử lý luôn tại đây
        if (isSuccess && order && order.status === 'PENDING') {
            this.logger.log(
                `🔄 IPN chưa xử lý, return handler sẽ cộng currency cho order: ${order.orderCode}`,
            );

            try {
                // Kiểm tra số tiền
                if (
                    verifyResult.vnp_Amount !== undefined &&
                    verifyResult.vnp_Amount !== order.amount
                ) {
                    this.logger.warn(
                        `Amount mismatch: expected ${order.amount}, got ${verifyResult.vnp_Amount}`,
                    );
                } else {
                    // Update order status
                    await this.prisma.paymentOrder.update({
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

                    // Cộng currency cho user
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
                        `✅ Return handler credited: ${order.orderCode}, gems: +${order.gems}, coins: +${order.coins}`,
                    );
                }
            } catch (error) {
                this.logger.error(
                    `Return handler credit error: ${error.message}`,
                    error.stack,
                );
            }
        } else if (isSuccess && order && order.status === 'SUCCESS') {
            this.logger.log(
                `Order ${order.orderCode} đã được IPN xử lý trước đó.`,
            );
        } else if (!isSuccess && order && order.status === 'PENDING') {
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
        }

        return {
            success: isSuccess,
            message: isSuccess
                ? 'Giao dịch thành công'
                : `Giao dịch không thành công. Mã lỗi: ${verifyResult.vnp_ResponseCode}`,
            orderCode: verifyResult.vnp_TxnRef,
            amount: verifyResult.vnp_Amount,
            transactionNo: verifyResult.vnp_TransactionNo,
            bankCode: verifyResult.vnp_BankCode,
            payDate: verifyResult.vnp_PayDate,
            responseCode: verifyResult.vnp_ResponseCode,
            gems: order?.gems,
            coins: order?.coins,
        };
    }
}
