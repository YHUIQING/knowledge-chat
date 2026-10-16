import { Injectable } from '@nestjs/common';

export interface TextChunk {
  index: number;
  content: string;
  charCount: number;
}

export interface ChunkOptions {
  /** 目标切片字数，默认 500 */
  chunkSize?: number;
  /** 重叠窗口字数，默认 80 */
  overlap?: number;
}

@Injectable()
export class ChunkingService {
  /**
   * 先按段落拆分，再按字数合并/切分，大切片使用重叠滑动窗口。
   */
  chunk(text: string, options: ChunkOptions = {}): TextChunk[] {
    const chunkSize = options.chunkSize ?? 500;
    const overlap = Math.min(options.overlap ?? 80, chunkSize - 1);
    const normalized = text.replace(/\r\n/g, '\n').trim();
    if (!normalized) return [];

    const paragraphs = normalized
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    const rawPieces: string[] = [];
    let buffer = '';

    const flushBuffer = () => {
      if (!buffer) return;
      if (buffer.length <= chunkSize) {
        rawPieces.push(buffer);
      } else {
        rawPieces.push(...this.slidingWindow(buffer, chunkSize, overlap));
      }
      buffer = '';
    };

    for (const para of paragraphs) {
      if (para.length > chunkSize) {
        flushBuffer();
        rawPieces.push(...this.slidingWindow(para, chunkSize, overlap));
        continue;
      }

      const next = buffer ? `${buffer}\n\n${para}` : para;
      if (next.length <= chunkSize) {
        buffer = next;
      } else {
        flushBuffer();
        buffer = para;
      }
    }
    flushBuffer();

    return rawPieces.map((content, index) => ({
      index,
      content,
      charCount: content.length,
    }));
  }

  private slidingWindow(
    text: string,
    size: number,
    overlap: number,
  ): string[] {
    const step = Math.max(1, size - overlap);
    const out: string[] = [];
    for (let i = 0; i < text.length; i += step) {
      out.push(text.slice(i, i + size));
      if (i + size >= text.length) break;
    }
    return out;
  }
}
