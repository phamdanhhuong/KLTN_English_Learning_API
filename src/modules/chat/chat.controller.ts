import {
  Controller,
  Post,
  Get,
  Req,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';

@Controller('chat')
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
  async startChat(@Req() req: Request) {
    return this.forwardPost(req, '/chat/start');
  }

  @Post('message')
  async chat(@Req() req: Request) {
    return this.forwardPost(req, '/chat/message');
  }

  @Get('user/conversations')
  async getUserConversations(@Req() req: Request) {
    return this.forwardGet(req, '/chat/user/conversations');
  }

  @Get('conversation/:conversationId')
  async getConversationInfo(
    @Param('conversationId') conversationId: string,
    @Req() req: Request,
  ) {
    return this.forwardGet(req, `/chat/conversation/${conversationId}`);
  }

  @Get('conversation/:conversationId/history')
  async getConversationHistory(
    @Param('conversationId') conversationId: string,
    @Req() req: Request,
  ) {
    return this.forwardGet(req, `/chat/conversation/${conversationId}/history`);
  }

  private async forwardPost(req: Request, path: string) {
    try {
      console.log(`[ChatProxy] POST ${path} body:`, JSON.stringify(req.body));
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiEndpoint}${path}`, req.body, {
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': (req.headers['x-user-id'] as string) || req.body?.user_id || '',
            ...(req.headers['authorization'] && { 'authorization': req.headers['authorization'] as string }),
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

  private async forwardGet(req: Request, path: string) {
    try {
      const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
      const response = await firstValueFrom(
        this.httpService.get(`${this.aiEndpoint}${path}${queryString}`, {
          headers: {
            ...(req.headers['x-user-id'] && { 'x-user-id': req.headers['x-user-id'] as string }),
            ...(req.headers['authorization'] && { 'authorization': req.headers['authorization'] as string }),
          },
          timeout: 120000,
          maxContentLength: Infinity,
        }),
      );
      return response.data;
    } catch (error: any) {
      console.error(`[ChatProxy] GET ${path} error:`, error.response?.data || error.message);
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const data = error.response?.data || { message: 'AI service unavailable' };
      throw new HttpException(data, status);
    }
  }
}
