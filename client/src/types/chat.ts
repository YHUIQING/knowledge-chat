export type MessageRole = 'user' | 'assistant'

export interface SourceRef {
  id: string
  title: string
  excerpt: string
  score: number
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  sources?: SourceRef[]
  createdAt: number
  streaming?: boolean
}
