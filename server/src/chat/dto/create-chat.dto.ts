import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @IsIn(['system', 'user', 'assistant'])
  role!: 'system' | 'user' | 'assistant';

  @IsString()
  @MaxLength(100000)
  content!: string;
}

export class CreateChatDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[];

  /** 可选覆盖默认模型，如 deepseek-flash、qwen-plus */
  @IsOptional()
  @IsString()
  @MaxLength(128)
  model?: string;
}
