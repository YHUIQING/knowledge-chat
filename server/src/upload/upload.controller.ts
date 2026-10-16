import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';

const MAX_SIZE = 20 * 1024 * 1024;

@Controller('api/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_SIZE },
      fileFilter: (_req, file, cb) => {
        const name = (file.originalname || '').toLowerCase();
        const ok =
          name.endsWith('.pdf') ||
          name.endsWith('.md') ||
          name.endsWith('.markdown') ||
          name.endsWith('.txt') ||
          file.mimetype === 'application/pdf' ||
          file.mimetype === 'text/plain' ||
          file.mimetype === 'text/markdown';
        if (!ok) {
          cb(new Error('仅支持 PDF / Markdown / TXT 文件'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件（字段名：file）');
    }
    return this.uploadService.parseAndChunk(file);
  }
}
