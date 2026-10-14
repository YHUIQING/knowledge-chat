<script setup lang="ts">
import type { ChatMessage } from '../types/chat'

defineProps<{
  message: ChatMessage
}>()
</script>

<template>
  <article
    class="message"
    :class="message.role === 'user' ? 'message--user' : 'message--assistant'"
  >
    <div class="message__avatar" aria-hidden="true">
      <span v-if="message.role === 'user'">我</span>
      <span v-else>知</span>
    </div>

    <div class="message__body">
      <header class="message__meta">
        <span class="message__role">
          {{ message.role === 'user' ? '你' : '知识库 Agent' }}
        </span>
        <span v-if="message.streaming" class="message__status">正在生成</span>
      </header>

      <div class="message__content">
        <p v-if="message.content">{{ message.content }}</p>
        <p v-else-if="message.streaming" class="message__typing">
          <span /><span /><span />
        </p>
      </div>

      <ul
        v-if="message.sources?.length"
        class="message__sources"
        aria-label="引用来源"
      >
        <li v-for="source in message.sources" :key="source.id">
          <div class="source__head">
            <span class="source__title">{{ source.title }}</span>
            <span class="source__score">{{ Math.round(source.score * 100) }}%</span>
          </div>
          <p class="source__excerpt">{{ source.excerpt }}</p>
        </li>
      </ul>
    </div>
  </article>
</template>

<style scoped>
.message {
  display: flex;
  gap: 14px;
  max-width: 820px;
  width: 100%;
  margin: 0 auto;
  animation: rise 0.35s ease both;
}

.message--user {
  flex-direction: row-reverse;
}

.message__avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.message--assistant .message__avatar {
  background: linear-gradient(145deg, var(--accent), var(--accent-deep));
  color: #f7fffb;
}

.message--user .message__avatar {
  background: var(--ink-soft);
  color: var(--ink);
}

.message__body {
  min-width: 0;
  flex: 1;
}

.message--user .message__body {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.message--user .message__meta {
  flex-direction: row-reverse;
}

.message__role {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  letter-spacing: 0.04em;
}

.message__status {
  font-size: 11px;
  color: var(--accent);
}

.message__content {
  padding: 14px 16px;
  border-radius: 16px;
  line-height: 1.7;
  font-size: 15px;
  white-space: pre-wrap;
  word-break: break-word;
}

.message--assistant .message__content {
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--ink);
  border-top-left-radius: 6px;
  box-shadow: var(--shadow-soft);
}

.message--user .message__content {
  background: var(--user-bubble);
  color: var(--ink);
  border-top-right-radius: 6px;
}

.message__content p {
  margin: 0;
}

.message__typing {
  display: flex;
  gap: 5px;
  align-items: center;
  min-height: 1.4em;
}

.message__typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.35;
  animation: blink 1.2s infinite ease-in-out;
}

.message__typing span:nth-child(2) {
  animation-delay: 0.15s;
}

.message__typing span:nth-child(3) {
  animation-delay: 0.3s;
}

.message__sources {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: grid;
  gap: 8px;
  width: 100%;
}

.message__sources li {
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--source-bg);
  border: 1px solid var(--line);
}

.source__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
  margin-bottom: 4px;
}

.source__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.source__score {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--accent);
  font-weight: 600;
}

.source__excerpt {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--muted);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 0.25;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-2px);
  }
}
</style>
