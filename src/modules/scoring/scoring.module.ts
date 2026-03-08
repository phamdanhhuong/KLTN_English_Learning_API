import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScoringController } from './scoring.controller';

@Module({
  imports: [HttpModule],
  controllers: [ScoringController],
})
export class ScoringModule {}
