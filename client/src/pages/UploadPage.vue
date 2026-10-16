<template>
  <div class="app-shell">
    <div class="ambient" aria-hidden="true" />
    <AppHeader />

    <main class="stage">
      <section class="panel">
        <header class="panel__head">
          <p class="eyebrow">知识库入库</p>
          <h2 class="title">上传文档并预览切片</h2>
          <p class="desc">
            支持 PDF、Markdown、TXT。服务端会解析文本并按段落/字数切块（带重叠窗口），下方展示前 N 个 chunk。
          </p>
        </header>

        <div
          class="dropzone"
          :class="{ 'dropzone--active': dragging, 'dropzone--busy': uploading }"
          role="button"
          tabindex="0"
          @click="!uploading && inputRef?.click()"
          @keydown.enter.prevent="!uploading && inputRef?.click()"
          @dragenter.prevent="dragging = true"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDrop"
        >
          <input
            ref="inputRef"
            class="sr-only"
            type="file"
            accept=".pdf,.md,.markdown,.txt,application/pdf,text/plain,text/markdown"
            :disabled="uploading"
            @change="onFileChange"
            @click.stop
          />
          <p class="dropzone__title">拖拽文件到此处，或点击选择</p>
          <p class="dropzone__hint">PDF / Markdown / TXT · 最大 20MB</p>
          <span class="pick-btn" aria-hidden="true">
            {{ uploading ? '上传中…' : '选择文件' }}
          </span>
        </div>

        <div v-if="selectedName || uploading" class="progress-block">
          <div class="progress-meta">
            <span class="filename">{{ selectedName || '准备上传' }}</span>
            <span class="percent">{{ progress }}%</span>
          </div>
          <div class="progress-track" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-fill" :style="{ width: `${progress}%` }" />
          </div>
        </div>

        <p v-if="error" class="error" role="alert">{{ error }}</p>

        <section v-if="result" class="result" aria-live="polite">
          <div class="result__summary">
            <h3>切片预览</h3>
            <p>
              {{ result.filename }} · 共 {{ result.charCount }} 字 ·
              {{ result.chunkCount }} 个切片 · 展示前
              {{ result.chunks.length }} 个
            </p>
          </div>

          <ol class="chunks">
            <li v-for="chunk in result.chunks" :key="chunk.index" class="chunk">
              <div class="chunk__meta">
                <span class="chunk__index">#{{ chunk.index }}</span>
                <span class="chunk__len">{{ chunk.charCount }} 字</span>
              </div>
              <pre class="chunk__body">{{ chunk.content }}</pre>
            </li>
          </ol>
        </section>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import { uploadDocument } from '../services/uploadApi'
import type { UploadResult } from '../types/upload'

const ALLOWED = /\.(pdf|md|markdown|txt)$/i

const inputRef = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const uploading = ref(false)
const progress = ref(0)
const selectedName = ref('')
const error = ref('')
const result = ref<UploadResult | null>(null)
let abortController: AbortController | null = null

async function handleFile(file: File | undefined) {
  if (!file || uploading.value) return
  if (!ALLOWED.test(file.name)) {
    error.value = '仅支持 PDF / Markdown / TXT'
    return
  }

  error.value = ''
  result.value = null
  selectedName.value = file.name
  progress.value = 0
  uploading.value = true
  abortController?.abort()
  abortController = new AbortController()

  try {
    const data = await uploadDocument(
      file,
      (pct) => {
        progress.value = pct
      },
      abortController.signal,
    )
    progress.value = 100
    result.value = data
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return
    error.value = e instanceof Error ? e.message : '上传失败，请重试'
  } finally {
    uploading.value = false
    abortController = null
    if (inputRef.value) inputRef.value.value = ''
  }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  void handleFile(input.files?.[0])
}

function onDrop(e: DragEvent) {
  dragging.value = false
  void handleFile(e.dataTransfer?.files?.[0])
}

onBeforeUnmount(() => {
  abortController?.abort()
})
</script>

<style scoped>
.app-shell {
  position: relative;
  min-height: 100svh;
  display: grid;
  grid-template-rows: auto 1fr;
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

.stage {
  overflow: auto;
  min-height: 0;
}

.panel {
  max-width: 860px;
  margin: 0 auto;
  padding: 36px 24px 48px;
  animation: fade-up 0.45s ease both;
}

.panel__head {
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
}

.title {
  margin: 0;
  font-family: var(--display);
  font-size: clamp(1.6rem, 3.5vw, 2.2rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--ink);
}

.desc {
  margin: 12px 0 0;
  max-width: 38em;
  font-size: 15px;
  line-height: 1.7;
  color: var(--muted);
}

.dropzone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 28px 24px;
  border: 1.5px dashed color-mix(in srgb, var(--accent) 35%, var(--line));
  border-radius: 18px;
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
}

.dropzone--active {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--user-bubble) 70%, var(--surface));
  transform: translateY(-1px);
}

.dropzone--busy {
  opacity: 0.85;
  cursor: not-allowed;
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

.dropzone__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
}

.dropzone__hint {
  margin: 0;
  font-size: 13px;
  color: var(--muted-soft);
}

.pick-btn {
  display: inline-flex;
  margin-top: 10px;
  border-radius: 999px;
  padding: 10px 18px;
  background: linear-gradient(145deg, var(--accent), var(--accent-deep));
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 10px 22px rgba(20, 110, 90, 0.2);
}

.progress-block {
  margin-top: 18px;
}

.progress-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 13px;
}

.filename {
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.percent {
  color: var(--muted);
  flex-shrink: 0;
}

.progress-track {
  height: 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--line) 70%, transparent);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent), var(--accent-deep));
  transition: width 0.2s ease;
}

.error {
  margin: 14px 0 0;
  color: #b42318;
  font-size: 13px;
}

.result {
  margin-top: 28px;
}

.result__summary h3 {
  margin: 0;
  font-family: var(--display);
  font-size: 1.25rem;
  color: var(--ink);
}

.result__summary p {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--muted);
}

.chunks {
  list-style: none;
  margin: 18px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.chunk {
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  box-shadow: var(--shadow-soft);
  animation: fade-up 0.35s ease both;
}

.chunk__meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--muted);
}

.chunk__index {
  font-weight: 600;
  color: var(--accent-deep);
}

.chunk__body {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--sans);
  font-size: 13px;
  line-height: 1.65;
  color: var(--ink);
  max-height: 220px;
  overflow: auto;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .panel {
    padding-inline: 16px;
  }
}
</style>
