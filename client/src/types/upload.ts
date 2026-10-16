export interface TextChunk {
  index: number
  content: string
  charCount: number
}

export interface UploadResult {
  filename: string
  mimeType: string
  charCount: number
  chunkCount: number
  previewLimit: number
  chunks: TextChunk[]
}
