/** 从 Vite 环境变量读取配置（仅 VITE_ 前缀会注入前端） */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  apiKey: import.meta.env.VITE_API_KEY || '',
} as const

export function assertApiConfigured(): void {
  if (!env.apiBaseUrl || !env.apiKey) {
    throw new Error('请先在 .env 中配置 VITE_API_BASE_URL 与 VITE_API_KEY')
  }
}
