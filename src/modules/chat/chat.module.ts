import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { ChatController } from './chat.controller';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [ChatController],
})
export class ChatModule {}
