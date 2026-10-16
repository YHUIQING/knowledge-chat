<template>
  <div class="app-shell">
    <div class="ambient" aria-hidden="true" />

    <AppHeader
      show-clear
      :clear-disabled="isEmpty && !loading"
      @clear="clear"
    />

    <main class="stage">
      <section v-if="isEmpty" class="welcome">
        <p class="welcome__eyebrow">基于检索增强生成</p>
        <h2 class="welcome__title">有什么想从知识库里问的？</h2>
        <p class="welcome__desc">
          输入问题后，Agent 会检索相关文档片段并生成可追溯的回答。当前为前端 Mock，方便联调前先行体验交互。
        </p>

        <div class="suggestions" role="list">
          <button
            v-for="q in suggestedQuestions"
            :key="q"
            type="button"
            class="suggestion"
            role="listitem"
            @click="askSuggested(q)"
          >
            {{ q }}
          </button>
        </div>
      </section>

      <section v-else ref="listRef" class="thread" aria-live="polite">
        <MessageItem
          v-for="message in messages"
          :key="message.id"
          :message="message"
        />
      </section>
    </main>

    <footer class="dock">
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <ChatInput
        v-model="input"
        :loading="loading"
        @send="send()"
        @stop="stop"
      />
      <p class="hint">Enter 发送 · Shift + Enter 换行 · Demo 使用本地模拟检索</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import ChatInput from '../components/ChatInput.vue'
import MessageItem from '../components/MessageItem.vue'
import { useChat } from '../hooks/useChat.ts'

const {
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
} = useChat()

const listRef = ref<HTMLElement | null>(null)

watch(
  messages,
  async () => {
    await nextTick()
    const el = listRef.value
    if (el) el.scrollTop = el.scrollHeight
  },
  { deep: true },
)
</script>

<style scoped>
.app-shell {
  position: relative;
  min-height: 100svh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  isolation: isolate;
}

.ambient {
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(900px 480px at 12% -10%, rgba(26, 140, 116, 0.18), transparent 60%),
    radial-gradient(700px 420px at 92% 8%, rgba(47, 90, 140, 0.14), transparent 55%),
    radial-gradient(600px 360px at 50% 110%, rgba(196, 140, 70, 0.1), transparent 50%),
    linear-gradient(180deg, #f3f7f5 0%, #eef2f0 48%, #e8eeeb 100%);
}

.ambient::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.35;
  background-image:
    linear-gradient(rgba(20, 40, 34, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(20, 40, 34, 0.03) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
}

.stage {
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 24px 24px;
  text-align: left;
  animation: fade-up 0.5s ease both;
}

.welcome__eyebrow {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
}

.welcome__title {
  margin: 0;
  font-family: var(--display);
  font-size: clamp(1.75rem, 4vw, 2.45rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.2;
  color: var(--ink);
}

.welcome__desc {
  margin: 14px 0 0;
  max-width: 34em;
  font-size: 15px;
  line-height: 1.7;
  color: var(--muted);
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
}

.suggestion {
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  color: var(--ink);
  border-radius: 999px;
  padding: 10px 14px;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
  animation: fade-up 0.45s ease both;
}

.suggestion:nth-child(1) { animation-delay: 0.05s; }
.suggestion:nth-child(2) { animation-delay: 0.1s; }
.suggestion:nth-child(3) { animation-delay: 0.15s; }
.suggestion:nth-child(4) { animation-delay: 0.2s; }

.suggestion:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--accent) 40%, var(--line));
  background: var(--surface);
}

.thread {
  flex: 1;
  overflow-y: auto;
  padding: 28px 24px 12px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  scroll-behavior: smooth;
}

.dock {
  padding: 8px 24px 22px;
  max-width: 860px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.error {
  margin: 0 0 8px;
  color: #b42318;
  font-size: 13px;
}

.hint {
  margin: 10px 0 0;
  text-align: center;
  font-size: 12px;
  color: var(--muted-soft);
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .welcome,
  .thread {
    padding-inline: 16px;
  }

  .dock {
    padding-inline: 16px;
    padding-bottom: 16px;
  }
}
</style>
