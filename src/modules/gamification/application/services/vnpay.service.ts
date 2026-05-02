import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface VnpayPaymentParams {
    orderId: string;
    amount: number; // VND (sẽ × 100 khi gửi VNPay)
    orderInfo: string;
    ipAddr: string;
    bankCode?: string;
    locale?: string;
}

export interface VnpayVerifyResult {
    isValid: boolean;
    vnp_TxnRef?: string;
    vnp_Amount?: number;
    vnp_ResponseCode?: string;
    vnp_TransactionNo?: string;
    vnp_BankCode?: string;
    vnp_PayDate?: string;
    vnp_TransactionStatus?: string;
}

@Injectable()
export class VnpayService {
    private readonly tmnCode: string;
    private readonly hashSecret: string;
    private readonly vnpUrl: string;
    private readonly returnUrl: string;

    constructor(private readonly configService: ConfigService) {
        this.tmnCode = this.configService.getOrThrow<string>('VNPAY_TMN_CODE');
        this.hashSecret = this.configService.getOrThrow<string>('VNPAY_HASH_SECRET');
        this.vnpUrl = this.configService.getOrThrow<string>('VNPAY_URL');
        this.returnUrl = this.configService.getOrThrow<string>('VNPAY_RETURN_URL');
    }

    /**
     * Tạo URL thanh toán VNPay
     */
    createPaymentUrl(params: VnpayPaymentParams): string {
        const date = new Date();
        const createDate = this.formatDate(date);

        // Expire sau 15 phút
        const expireDate = new Date(date.getTime() + 15 * 60 * 1000);
        const expireDateStr = this.formatDate(expireDate);

        const vnpParams: Record<string, string> = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: this.tmnCode,
            vnp_Amount: String(params.amount * 100), // VNPay yêu cầu × 100
            vnp_CurrCode: 'VND',
            vnp_TxnRef: params.orderId,
            vnp_OrderInfo: params.orderInfo,
            vnp_OrderType: 'other',
            vnp_Locale: params.locale || 'vn',
            vnp_ReturnUrl: this.returnUrl,
            vnp_IpAddr: params.ipAddr,
            vnp_CreateDate: createDate,
            vnp_ExpireDate: expireDateStr,
        };

        if (params.bankCode) {
            vnpParams['vnp_BankCode'] = params.bankCode;
        }

        // Sort params theo tên tăng dần
        const sortedParams = this.sortObject(vnpParams);

        // Build query string cho hash
        const signData = new URLSearchParams(sortedParams).toString();

        // Tạo HMAC-SHA512
        const hmac = crypto.createHmac('sha512', this.hashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        // Append hash vào params
        sortedParams['vnp_SecureHash'] = signed;

        // Build final URL
        const queryString = new URLSearchParams(sortedParams).toString();
        return `${this.vnpUrl}?${queryString}`;
    }

    /**
     * Verify checksum từ VNPay callback (IPN / ReturnUrl)
     */
    verifyCallback(query: Record<string, string>): VnpayVerifyResult {
        const vnpParams = { ...query };
        const secureHash = vnpParams['vnp_SecureHash'];

        // Xóa hash fields trước khi verify
        delete vnpParams['vnp_SecureHash'];
        delete vnpParams['vnp_SecureHashType'];

        // Sort và tạo sign data
        const sortedParams = this.sortObject(vnpParams);
        const signData = new URLSearchParams(sortedParams).toString();

        // Tạo checksum
        const hmac = crypto.createHmac('sha512', this.hashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        const isValid = secureHash === signed;

        return {
            isValid,
            vnp_TxnRef: vnpParams['vnp_TxnRef'],
            vnp_Amount: vnpParams['vnp_Amount']
                ? parseInt(vnpParams['vnp_Amount']) / 100
                : undefined,
            vnp_ResponseCode: vnpParams['vnp_ResponseCode'],
            vnp_TransactionNo: vnpParams['vnp_TransactionNo'],
            vnp_BankCode: vnpParams['vnp_BankCode'],
            vnp_PayDate: vnpParams['vnp_PayDate'],
            vnp_TransactionStatus: vnpParams['vnp_TransactionStatus'],
        };
    }

    /**
     * Sort object theo key tăng dần
     */
    private sortObject(obj: Record<string, string>): Record<string, string> {
        const sorted: Record<string, string> = {};
        const keys = Object.keys(obj).sort();
        for (const key of keys) {
            sorted[key] = obj[key];
        }
        return sorted;
    }

    /**
     * Format date thành yyyyMMddHHmmss
     */
    private formatDate(date: Date): string {
        const pad = (n: number) => String(n).padStart(2, '0');
        return (
            date.getFullYear().toString() +
            pad(date.getMonth() + 1) +
            pad(date.getDate()) +
            pad(date.getHours()) +
            pad(date.getMinutes()) +
            pad(date.getSeconds())
        );
    }
}
