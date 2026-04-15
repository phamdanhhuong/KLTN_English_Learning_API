import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { VoiceGateway } from './voice.gateway';
import { VoiceService } from './voice.service';
import { VoiceController } from './voice.controller';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [VoiceController],
  providers: [VoiceGateway, VoiceService],
})
export class VoiceModule {}
