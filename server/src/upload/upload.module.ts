import { Module } from '@nestjs/common';
import { ChunkingService } from './chunking.service';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  controllers: [UploadController],
  providers: [UploadService, ChunkingService],
  exports: [ChunkingService],
})
export class UploadModule {}
