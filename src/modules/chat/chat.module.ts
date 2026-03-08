import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ChatController } from './chat.controller';

@Module({
  imports: [HttpModule],
  controllers: [ChatController],
})
export class ChatModule {}
