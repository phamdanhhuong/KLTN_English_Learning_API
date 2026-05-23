import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LeaderboardService } from '../services/leaderboard.service';

@Injectable()
export class LeagueScheduler {
  private readonly logger = new Logger(LeagueScheduler.name);

  constructor(private readonly leaderboardService: LeaderboardService) {}

  /** Weekly rotation — runs Monday 00:10 Vietnam time (Sunday 17:10 UTC) */
  @Cron('10 17 * * 0')
  async handleWeeklyRotation() {
    this.logger.log('🔄 Running weekly league rotation...');

    try {
      await this.leaderboardService.processWeeklyRotation();
      this.logger.log('✅ Weekly league rotation completed');
    } catch (error: any) {
      this.logger.error(`League rotation failed: ${error.message}`);
    }
  }

  /** Daily inactivity decay — runs every day at 02:00 Vietnam time (19:00 UTC previous day) */
  @Cron('0 19 * * *')
  async handleInactivityDecay() {
    this.logger.log('📉 Running daily inactivity XP decay...');

    try {
      await this.leaderboardService.processInactivityDecay();
      this.logger.log('✅ Daily inactivity decay completed');
    } catch (error: any) {
      this.logger.error(`Inactivity decay failed: ${error.message}`);
    }
  }

  /** Weekly tier demotion — runs Sunday 01:00 Vietnam time (Saturday 18:00 UTC) */
  @Cron('0 18 * * 6')
  async handlePeriodicTierDecay() {
    this.logger.log('⬇️ Running weekly tier decay for inactive users...');

    try {
      await this.leaderboardService.processPeriodicTierDecay();
      this.logger.log('✅ Weekly tier decay completed');
    } catch (error: any) {
      this.logger.error(`Tier decay failed: ${error.message}`);
    }
  }
}
