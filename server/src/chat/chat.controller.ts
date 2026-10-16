import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';

@Controller('api/chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly config: ConfigService,
  ) {}

  /**
   * SSE 流式对话。
   * 前端用 AbortController.abort() 关闭连接后，服务端会中断上游 LLM 请求。
   */
  @Post()
  async chat(
    @Body() body: CreateChatDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    if (!this.config.get<string>('LLM_API_KEY')) {
      throw new ServiceUnavailableException('服务端未配置 LLM_API_KEY');
    }

    const abortController = new AbortController();

    const onClose = () => {
      if (!abortController.signal.aborted) {
        abortController.abort();
      }
    };
    req.on('close', onClose);

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const writeEvent = (data: unknown) => {
      if (res.writableEnded || abortController.signal.aborted) return;
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      for await (const event of this.chatService.streamChat(
        body,
        abortController.signal,
      )) {
        writeEvent(event);
        if (event.type === 'error' || event.type === 'done') {
          break;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '服务内部错误';
      writeEvent({ type: 'error', message });
    } finally {
      req.off('close', onClose);
      if (!res.writableEnded) {
        res.end();
      }
    }
  }
}
