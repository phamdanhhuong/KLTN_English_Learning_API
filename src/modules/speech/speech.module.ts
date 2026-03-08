import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SpeechController } from './speech.controller';

@Module({
  imports: [HttpModule],
  controllers: [SpeechController],
})
export class SpeechModule {}
