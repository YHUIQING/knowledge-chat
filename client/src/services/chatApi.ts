import { env } from '../config/env'

export interface ChatApiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type SseEvent =
  | { type: 'chunk'; content: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

/**
 * 调用后端 POST /api/chat（SSE），逐段回调增量文本。
 * 传入 AbortSignal 可中断生成（关闭连接）。
 */
export async function streamChat(
  messages: ChatApiMessage[],
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const base = env.apiBaseUrl.replace(/\/$/, '')
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ messages }),
    signal,
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(detail || `请求失败 (${res.status})`)
  }

  if (!res.body) {
    throw new Error('浏览器不支持流式响应')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let answer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''

    for (const part of parts) {
      const line = part
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l.startsWith('data:'))
      if (!line) continue

      const raw = line.slice(5).trim()
      if (!raw || raw === '[DONE]') continue

      let event: SseEvent
      try {
        event = JSON.parse(raw) as SseEvent
      } catch {
        continue
      }

      if (event.type === 'chunk' && event.content) {
        answer += event.content
        onChunk(answer)
      } else if (event.type === 'error') {
        throw new Error(event.message || '模型返回错误')
      } else if (event.type === 'done') {
        return answer
      }
    }
  }

  return answer
}
