import { computed, nextTick, ref } from 'vue'
import { mockAsk, suggestedQuestions } from '../services/mockAgent'
import type { ChatMessage } from '../types/chat'

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function useChat() {
  const messages = ref<ChatMessage[]>([])
  const input = ref('')
  const loading = ref(false)
  const error = ref('')
  let abortController: AbortController | null = null

  const isEmpty = computed(() => messages.value.length === 0)

  async function send(text?: string) {
    const content = (text ?? input.value).trim()
    if (!content || loading.value) return

    error.value = ''
    input.value = ''

    messages.value.push({
      id: uid(),
      role: 'user',
      content,
      createdAt: Date.now(),
    })

    const assistantId = uid()
    messages.value.push({
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      streaming: true,
    })

    loading.value = true
    abortController = new AbortController()

    try {
      const result = await mockAsk(
        content,
        (partial) => {
          const msg = messages.value.find((m) => m.id === assistantId)
          if (msg) msg.content = partial
        },
        abortController.signal,
      )

      const msg = messages.value.find((m) => m.id === assistantId)
      if (msg) {
        msg.content = result.answer
        msg.sources = result.sources
        msg.streaming = false
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        const msg = messages.value.find((m) => m.id === assistantId)
        if (msg) {
          msg.streaming = false
          if (!msg.content) msg.content = '（已停止生成）'
        }
      } else {
        error.value = '回答生成失败，请重试'
        messages.value = messages.value.filter((m) => m.id !== assistantId)
      }
    } finally {
      loading.value = false
      abortController = null
      await nextTick()
    }
  }

  function stop() {
    abortController?.abort()
  }

  function clear() {
    stop()
    messages.value = []
    error.value = ''
    input.value = ''
  }

  function askSuggested(q: string) {
    void send(q)
  }

  return {
    messages,
    input,
    loading,
    error,
    isEmpty,
    suggestedQuestions,
    send,
    stop,
    clear,
    askSuggested,
  }
}
