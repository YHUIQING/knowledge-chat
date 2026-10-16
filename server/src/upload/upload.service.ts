import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import { ChunkingService, type TextChunk } from './chunking.service';

const ALLOWED_EXT = new Set(['.pdf', '.md', '.markdown', '.txt']);
const PREVIEW_LIMIT = 8;

export interface UploadParseResult {
  filename: string;
  mimeType: string;
  charCount: number;
  chunkCount: number;
  previewLimit: number;
  chunks: TextChunk[];
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly chunking: ChunkingService) {}

  async parseAndChunk(file: Express.Multer.File): Promise<UploadParseResult> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('未收到文件内容');
    }

    const filename = file.originalname || 'unnamed';
    const ext = this.getExt(filename);
    if (!ALLOWED_EXT.has(ext)) {
      throw new BadRequestException(
        '仅支持 PDF / Markdown / TXT 文件（.pdf .md .markdown .txt）',
      );
    }

    const text = await this.extractText(file, ext);
    if (!text.trim()) {
      throw new BadRequestException('未能从文件中解析出文本内容');
    }

    const allChunks = this.chunking.chunk(text);
    this.logger.log(
      `已解析 ${filename}：${text.length} 字 → ${allChunks.length} 个切片`,
    );

    return {
      filename,
      mimeType: file.mimetype || 'application/octet-stream',
      charCount: text.length,
      chunkCount: allChunks.length,
      previewLimit: PREVIEW_LIMIT,
      chunks: allChunks.slice(0, PREVIEW_LIMIT),
    };
  }

  private getExt(filename: string): string {
    const i = filename.lastIndexOf('.');
    return i >= 0 ? filename.slice(i).toLowerCase() : '';
  }

  private async extractText(
    file: Express.Multer.File,
    ext: string,
  ): Promise<string> {
    if (ext === '.pdf') {
      return this.extractPdf(file.buffer);
    }
    return file.buffer.toString('utf-8');
  }

  private async extractPdf(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text ?? '';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'PDF 解析失败';
      this.logger.error(`PDF 解析失败: ${message}`);
      throw new BadRequestException(`PDF 解析失败: ${message}`);
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  }
}
