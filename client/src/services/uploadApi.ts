import { env } from '../config/env'
import type { UploadResult } from '../types/upload'

/**
 * 上传文件到 POST /api/upload，通过 XHR 上报进度（0–100）。
 */
export function uploadDocument(
  file: File,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
): Promise<UploadResult> {
  const base = env.apiBaseUrl.replace(/\/$/, '')

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const form = new FormData()
    form.append('file', file)

    const onAbort = () => {
      xhr.abort()
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      signal?.removeEventListener('abort', onAbort)
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as UploadResult)
        } catch {
          reject(new Error('响应解析失败'))
        }
        return
      }

      let message = `上传失败 (${xhr.status})`
      try {
        const body = JSON.parse(xhr.responseText) as {
          message?: string | string[]
        }
        if (typeof body.message === 'string') message = body.message
        else if (Array.isArray(body.message)) message = body.message.join('；')
      } catch {
        if (xhr.responseText) message = xhr.responseText.slice(0, 200)
      }
      reject(new Error(message))
    }

    xhr.onerror = () => {
      signal?.removeEventListener('abort', onAbort)
      reject(new Error('网络错误，请确认后端已启动'))
    }

    xhr.onabort = () => {
      signal?.removeEventListener('abort', onAbort)
      reject(new DOMException('Aborted', 'AbortError'))
    }

    xhr.open('POST', `${base}/api/upload`)
    xhr.send(form)
  })
}
