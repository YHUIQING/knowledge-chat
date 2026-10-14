<template>
  <header class="topbar">
    <div class="brand">
      <div class="brand__mark" aria-hidden="true">
        <span />
        <span />
      </div>
      <div>
        <h1 class="brand__name">Knowledge Chat</h1>
        <p class="brand__tag">AI 知识库问答 Agent Demo</p>
      </div>
    </div>

    <button
      type="button"
      class="ghost-btn"
      :disabled="clearDisabled"
      @click="emit('clear')"
    >
      清空对话
    </button>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  clearDisabled: boolean
}>()

const emit = defineEmits<{
  clear: []
}>()
</script>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 28px;
  border-bottom: 1px solid color-mix(in srgb, var(--line) 80%, transparent);
  backdrop-filter: blur(10px);
  background: color-mix(in srgb, #f5f8f6 72%, transparent);
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  text-align: left;
}

.brand__mark {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: linear-gradient(145deg, var(--accent), var(--accent-deep));
  display: grid;
  place-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(20, 110, 90, 0.22);
}

.brand__mark span {
  position: absolute;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
}

.brand__mark span:first-child {
  width: 16px;
  height: 3px;
  transform: translateY(-4px);
}

.brand__mark span:last-child {
  width: 10px;
  height: 3px;
  transform: translateY(4px);
  opacity: 0.7;
}

.brand__name {
  margin: 0;
  font-family: var(--display);
  font-size: clamp(1.35rem, 2.2vw, 1.7rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--ink);
}

.brand__tag {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--muted);
  letter-spacing: 0.02em;
}

.ghost-btn {
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--surface) 80%, transparent);
  color: var(--ink);
  border-radius: 999px;
  padding: 8px 14px;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
}

.ghost-btn:hover:not(:disabled) {
  background: var(--surface);
  border-color: color-mix(in srgb, var(--accent) 35%, var(--line));
}

.ghost-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .topbar {
    padding: 14px 16px;
  }

  .brand__tag {
    display: none;
  }
}
</style>
