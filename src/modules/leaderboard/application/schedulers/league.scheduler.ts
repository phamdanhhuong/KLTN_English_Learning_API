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
}
