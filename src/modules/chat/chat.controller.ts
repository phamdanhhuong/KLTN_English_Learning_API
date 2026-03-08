import {
  Controller,
  Post,
  Get,
  Req,
  Param,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  private readonly aiEndpoint: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.aiEndpoint =
      this.configService.get<string>('AI_SERVICE_ENDPOINT') || 'http://localhost:3006';
  }

  @Post('start')
  async startChat(@Req() req: any) {
    return this.forwardPost(req, '/chat/start');
  }

  @Post('message')
  async chat(@Req() req: any) {
    return this.forwardPost(req, '/chat/message');
  }

  @Get('user/conversations')
  async getUserConversations(@Req() req: any) {
    return this.forwardGet(req, '/chat/user/conversations');
  }

  @Get('conversation/:conversationId')
  async getConversationInfo(
    @Param('conversationId') conversationId: string,
    @Req() req: any,
  ) {
    return this.forwardGet(req, `/chat/conversation/${conversationId}`);
  }

  @Get('conversation/:conversationId/history')
  async getConversationHistory(
    @Param('conversationId') conversationId: string,
    @Req() req: any,
  ) {
    return this.forwardGet(req, `/chat/conversation/${conversationId}/history`);
  }

  private getUserId(req: any): string {
    return req.headers['x-user-id'] || req.user?.sub || req.body?.user_id || '';
  }

  private async forwardPost(req: any, path: string) {
    try {
      const userId = this.getUserId(req);
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiEndpoint}${path}`, req.body, {
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          timeout: 120000,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }),
      );
      return response.data;
    } catch (error: any) {
      console.error(`[ChatProxy] POST ${path} error:`, JSON.stringify(error.response?.data, null, 2));
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const data = error.response?.data || { message: 'AI service unavailable' };
      throw new HttpException(data, status);
    }
  }

  private async forwardGet(req: any, path: string) {
    try {
      const userId = this.getUserId(req);
      const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
      const response = await firstValueFrom(
        this.httpService.get(`${this.aiEndpoint}${path}${queryString}`, {
          headers: {
            'x-user-id': userId,
          },
          timeout: 120000,
          maxContentLength: Infinity,
        }),
      );
      return response.data;
    } catch (error: any) {
      console.error(`[ChatProxy] GET ${path} error:`, JSON.stringify(error.response?.data, null, 2));
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const data = error.response?.data || { message: 'AI service unavailable' };
      throw new HttpException(data, status);
    }
  }
}
