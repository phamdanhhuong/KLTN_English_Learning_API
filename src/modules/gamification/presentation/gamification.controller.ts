import {
  Controller, Post, Get, Body, UseGuards, Request,
  HttpCode, HttpStatus, Query, Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AddXpUseCase } from '../application/use-cases/xp/add-xp.usecase';
import { UpdateStreakUseCase } from '../application/use-cases/streak/update-streak.usecase';
import { UseStreakFreezeUseCase } from '../application/use-cases/streak/use-streak-freeze.usecase';
import { GetStreakStatusUseCase } from '../application/use-cases/streak/get-streak-status.usecase';
import { GetStreakCalendarUseCase } from '../application/use-cases/streak/get-streak-calendar.usecase';
import { GetStreakHistoryUseCase } from '../application/use-cases/streak/get-streak-history.usecase';
import { SpendCurrencyUseCase } from '../application/use-cases/currency/spend-currency.usecase';
import { AddCurrencyUseCase } from '../application/use-cases/currency/add-currency.usecase';
import { GetCurrencyBalanceUseCase } from '../application/use-cases/currency/get-currency-balance.usecase';
import { ConsumeEnergyUseCase, GetEnergyUseCase } from '../application/use-cases/energy/energy.usecase';
import { BuyEnergyUseCase } from '../application/use-cases/energy/buy-energy.usecase';
import { LessonCompletedUseCase, LessonCompletedDto } from '../application/use-cases/lesson-completed.usecase';

@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(
    private readonly addXpUseCase: AddXpUseCase,
    private readonly updateStreakUseCase: UpdateStreakUseCase,
    private readonly useStreakFreezeUseCase: UseStreakFreezeUseCase,
    private readonly getStreakStatusUseCase: GetStreakStatusUseCase,
    private readonly getStreakCalendarUseCase: GetStreakCalendarUseCase,
    private readonly getStreakHistoryUseCase: GetStreakHistoryUseCase,
    private readonly spendCurrencyUseCase: SpendCurrencyUseCase,
    private readonly addCurrencyUseCase: AddCurrencyUseCase,
    private readonly getCurrencyBalanceUseCase: GetCurrencyBalanceUseCase,
    private readonly consumeEnergyUseCase: ConsumeEnergyUseCase,
    private readonly getEnergyUseCase: GetEnergyUseCase,
    private readonly buyEnergyUseCase: BuyEnergyUseCase,
    private readonly lessonCompletedUseCase: LessonCompletedUseCase,
  ) {}

  // ─── XP ──────────────────────────────────────────────────
  @Post('xp/add')
  @HttpCode(HttpStatus.OK)
  async addXp(
    @Request() req: any,
    @Body() body: { amount: number; source?: 'lesson' | 'exercise' | 'streak' | 'quest' | 'achievement' },
  ) {
    return this.addXpUseCase.execute(req.user.sub, body.amount, body.source);
  }

  // ─── STREAK ──────────────────────────────────────────────
  @Get('streak')
  async getStreakStatus(@Request() req: any) {
    return this.getStreakStatusUseCase.execute(req.user.sub);
  }

  @Get('streak/calendar')
  async getStreakCalendar(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.getStreakCalendarUseCase.execute(
      req.user.sub,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('streak/history')
  async getStreakHistory(@Request() req: any, @Query('limit') limit?: number) {
    return this.getStreakHistoryUseCase.execute(req.user.sub, limit ?? 10);
  }

  @Post('streak/update')
  @HttpCode(HttpStatus.OK)
  async updateStreak(@Request() req: any) {
    return this.updateStreakUseCase.execute(req.user.sub);
  }

  @Post('streak/freeze/buy')
  @HttpCode(HttpStatus.OK)
  async buyStreakFreeze(@Request() req: any) {
    return this.useStreakFreezeUseCase.execute(req.user.sub);
  }

  // ─── CURRENCY ────────────────────────────────────────────
  @Get('currency')
  async getCurrencyBalance(@Request() req: any) {
    return this.getCurrencyBalanceUseCase.execute(req.user.sub);
  }

  @Post('currency/spend')
  @HttpCode(HttpStatus.OK)
  async spendCurrency(
    @Request() req: any,
    @Body() body: { amount: number; currencyType: 'GEMS' | 'COINS'; reason: string; metadata?: Record<string, any> },
  ) {
    return this.spendCurrencyUseCase.execute(
      req.user.sub, body.amount, body.currencyType, body.reason, body.metadata,
    );
  }

  @Post('currency/add')
  @HttpCode(HttpStatus.OK)
  async addCurrency(
    @Request() req: any,
    @Body() body: { gems?: number; coins?: number; reason: string; metadata?: Record<string, any> },
  ) {
    return this.addCurrencyUseCase.execute(
      req.user.sub, body.gems ?? 0, body.coins ?? 0, body.reason, body.metadata,
    );
  }

  // ─── ENERGY ──────────────────────────────────────────────
  @Get('energy')
  async getEnergy(@Request() req: any) {
    return this.getEnergyUseCase.execute(req.user.sub);
  }

  @Get('energy/pricing')
  async getEnergyPricing() {
    return this.buyEnergyUseCase.getPricing();
  }

  @Post('energy/consume')
  @HttpCode(HttpStatus.OK)
  async consumeEnergy(@Request() req: any, @Body() body: { amount?: number }) {
    return this.consumeEnergyUseCase.execute(req.user.sub, body.amount ?? 1);
  }

  @Post('energy/buy')
  @HttpCode(HttpStatus.OK)
  async buyEnergy(
    @Request() req: any,
    @Body() body: { amount?: number; paymentMethod?: 'GEMS' | 'COINS' },
  ) {
    return this.buyEnergyUseCase.execute(
      req.user.sub, body.amount ?? 1, body.paymentMethod ?? 'GEMS',
    );
  }

  // ─── LESSON INTEGRATION ──────────────────────────────────
  @Post('lesson-completed')
  @HttpCode(HttpStatus.OK)
  async lessonCompleted(@Request() req: any, @Body() body: Omit<LessonCompletedDto, 'userId'>) {
    return this.lessonCompletedUseCase.execute({ ...body, userId: req.user.sub });
  }
}
