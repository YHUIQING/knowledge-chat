import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { CreateChatDto } from './dto/create-chat.dto';

export type ChatSseEvent =
  | { type: 'chunk'; content: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly client: OpenAI;
  private readonly defaultModel: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('LLM_API_KEY');
    const baseURL =
      this.config.get<string>('LLM_BASE_URL') ?? 'https://api.deepseek.com';

    if (!apiKey) {
      this.logger.warn('未配置 LLM_API_KEY，调用 /api/chat 将失败');
    }

    this.client = new OpenAI({
      apiKey: apiKey ?? 'missing-key',
      baseURL,
    });
    this.defaultModel =
      this.config.get<string>('LLM_MODEL') ?? 'deepseek-flash';
  }

  /**
   * 以 OpenAI 兼容协议流式调用大模型，并通过 AbortSignal 支持中断。
   * DeepSeek / 千问 / OpenAI 均可复用此路径（改 baseURL + model 即可）。
   * @see https://api-docs.deepseek.com/zh-cn/guides/multi_round_chat
   */
  async *streamChat(
    dto: CreateChatDto,
    signal: AbortSignal,
  ): AsyncGenerator<ChatSseEvent> {
    const model = dto.model ?? this.defaultModel;
    const messages = dto.messages as ChatCompletionMessageParam[];

    try {
      const stream = await this.client.chat.completions.create(
        {
          model,
          messages,
          stream: true,
        },
        { signal },
      );

      for await (const part of stream) {
        if (signal.aborted) {
          break;
        }
        const content = part.choices[0]?.delta?.content;
        if (content) {
          yield { type: 'chunk', content };
        }
      }

      if (!signal.aborted) {
        yield { type: 'done' };
      }
    } catch (err) {
      if (signal.aborted || isAbortError(err)) {
        this.logger.log('生成已中断');
        return;
      }
      const message = err instanceof Error ? err.message : '模型调用失败';
      this.logger.error(`模型调用失败: ${message}`);
      yield { type: 'error', message };
    }
  }
}

function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: string; code?: string; message?: string };
  return (
    e.name === 'AbortError' ||
    e.code === 'ABORT_ERR' ||
    (typeof e.message === 'string' && /abort/i.test(e.message))
  );
}
