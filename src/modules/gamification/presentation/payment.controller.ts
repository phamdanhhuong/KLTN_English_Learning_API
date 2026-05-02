import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
    Query,
    Res,
    Ip,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreatePaymentUseCase } from '../application/use-cases/currency/create-payment.usecase';
import { VnpayIpnUseCase } from '../application/use-cases/currency/vnpay-ipn.usecase';
import { VnpayReturnUseCase } from '../application/use-cases/currency/vnpay-return.usecase';

@Controller('gamification/payment')
export class PaymentController {
    constructor(
        private readonly createPaymentUseCase: CreatePaymentUseCase,
        private readonly vnpayIpnUseCase: VnpayIpnUseCase,
        private readonly vnpayReturnUseCase: VnpayReturnUseCase,
    ) {}

    // ─── PAYMENT PACKAGES ─────────────────────────────────────
    @Get('packages')
    @UseGuards(JwtAuthGuard)
    async getPackages() {
        return this.createPaymentUseCase.getPackages();
    }

    // ─── CREATE PAYMENT URL ───────────────────────────────────
    @Post('create')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async createPayment(
        @Request() req: any,
        @Ip() ip: string,
        @Body() body: { packageId: string; bankCode?: string },
    ) {
        const ipAddr =
            req.headers['x-forwarded-for'] || ip || '127.0.0.1';
        return this.createPaymentUseCase.execute(
            req.user.sub,
            body.packageId,
            typeof ipAddr === 'string' ? ipAddr : ipAddr[0],
        );
    }

    // ─── VNPAY IPN (server-to-server, NO AUTH) ────────────────
    @Get('vnpay-ipn')
    async vnpayIpn(@Query() query: Record<string, string>, @Res() res: Response) {
        const result = await this.vnpayIpnUseCase.execute(query);
        // VNPay yêu cầu trả JSON với RspCode và Message
        res.status(HttpStatus.OK).json(result);
    }

    // ─── VNPAY RETURN URL (redirect trình duyệt, NO AUTH) ────
    @Get('vnpay-return')
    async vnpayReturn(@Query() query: Record<string, string>) {
        return this.vnpayReturnUseCase.execute(query);
    }
}
