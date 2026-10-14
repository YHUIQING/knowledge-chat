<template>
  <div class="composer">
    <label class="sr-only" for="chat-input">输入问题</label>
    <textarea
      id="chat-input"
      ref="textareaRef"
      v-model="model"
      rows="1"
      :disabled="disabled"
      placeholder="向知识库提问，例如：什么是 RAG？"
      @keydown="onKeydown"
    />

    <button
      v-if="loading"
      type="button"
      class="composer__btn composer__btn--stop"
      @click="emit('stop')"
    >
      停止
    </button>
    <button
      v-else
      type="button"
      class="composer__btn"
      :disabled="disabled || !model.trim()"
      @click="emit('send')"
    >
      发送
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const model = defineModel<string>({ required: true })

const props = defineProps<{
  loading: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  send: []
  stop: []
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

function resize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 160)}px`
}

watch(model, async () => {
  await nextTick()
  resize()
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (!props.loading) emit('send')
  }
}
</script>

<style scoped>
.composer {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 18px;
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-lift);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.composer:focus-within {
  border-color: color-mix(in srgb, var(--accent) 45%, var(--line));
  box-shadow: var(--shadow-lift), 0 0 0 3px color-mix(in srgb, var(--accent) 16%, transparent);
}

textarea {
  flex: 1;
  resize: none;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 15px;
  line-height: 1.55;
  max-height: 160px;
  padding: 6px 4px;
}

textarea::placeholder {
  color: var(--muted-soft);
}

.composer__btn {
  flex-shrink: 0;
  border: 0;
  border-radius: 12px;
  padding: 10px 18px;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(145deg, var(--accent), var(--accent-deep));
  color: #f7fffb;
  transition: transform 0.15s ease, opacity 0.15s ease, filter 0.15s ease;
}

.composer__btn:hover:not(:disabled) {
  filter: brightness(1.05);
  transform: translateY(-1px);
}

.composer__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.composer__btn--stop {
  background: var(--ink);
  color: #fff;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
