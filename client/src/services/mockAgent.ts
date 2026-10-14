import type { SourceRef } from '../types/chat'

interface MockAnswer {
  keywords: string[]
  answer: string
  sources: SourceRef[]
}

const knowledgeBase: MockAnswer[] = [
  {
    keywords: ['什么是', '知识库', 'rag', '检索'],
    answer:
      '知识库问答 Agent 基于 RAG（Retrieval-Augmented Generation）架构：先把文档切片并向量化入库，用户提问时检索最相关片段，再把片段作为上下文交给大模型生成回答。这样既能利用模型的理解能力，又能把答案锚定在企业自有资料上，降低幻觉。',
    sources: [
      {
        id: 'doc-rag-01',
        title: 'RAG 架构白皮书 · 第 2 章',
        excerpt: '检索增强生成将外部知识注入提示词，使回答可追溯、可校验。',
        score: 0.94,
      },
      {
        id: 'doc-kb-02',
        title: '内部知识库接入规范',
        excerpt: '文档需完成清洗、分块、嵌入与索引四个步骤后方可被 Agent 引用。',
        score: 0.88,
      },
    ],
  },
  {
    keywords: ['怎么用', '如何使用', '上手', '开始'],
    answer:
      '使用方式很简单：在下方输入框描述你的问题，点击发送即可。Agent 会先检索知识库，再基于命中片段作答，并在回复下方展示引用来源。你也可以点击推荐问题快速体验。当前为 Demo 模式，回复由前端 Mock；接入真实后端后，只需替换问答接口即可。',
    sources: [
      {
        id: 'doc-guide-01',
        title: '产品使用手册 · 快速开始',
        excerpt: '在对话框输入自然语言问题，系统自动完成检索与生成。',
        score: 0.91,
      },
    ],
  },
  {
    keywords: ['权限', '安全', '隔离', '多租户'],
    answer:
      '生产环境建议按租户/部门做知识库隔离：检索阶段过滤无权限文档，回答阶段对敏感字段脱敏，并记录提问与引用审计日志。Demo 暂未接入鉴权，但页面已预留来源展示，便于后续对接权限与审计链路。',
    sources: [
      {
        id: 'doc-sec-01',
        title: '企业知识安全策略',
        excerpt: '检索过滤应优先于生成过滤，避免无授权内容进入上下文窗口。',
        score: 0.9,
      },
    ],
  },
  {
    keywords: ['模型', 'llm', 'openai', '通义', '接口'],
    answer:
      'Agent 对模型层保持可插拔：可对接 OpenAI、通义千问或其他兼容 OpenAI 协议的服务。前端只关心流式/非流式聊天接口；检索、重排、提示词组装建议放在后端 Agent 服务中完成。',
    sources: [
      {
        id: 'doc-llm-01',
        title: '模型接入说明',
        excerpt: '统一 Chat Completions 协议，便于切换供应商与本地部署模型。',
        score: 0.87,
      },
    ],
  },
]

const fallback: MockAnswer = {
  keywords: [],
  answer:
    '我已在知识库中检索相关内容。当前 Demo 的匹配样本有限，建议尝试：「什么是知识库问答」「如何使用本 Demo」「权限与安全如何设计」「可以对接哪些模型」。接入真实检索服务后，这里会返回基于你私有文档的精准回答。',
  sources: [
    {
      id: 'doc-fallback-01',
      title: 'Demo 说明文档',
      excerpt: '前端目前使用关键词匹配模拟检索；真实环境请替换为向量检索 API。',
      score: 0.72,
    },
  ],
}

function pickAnswer(question: string): MockAnswer {
  const q = question.toLowerCase()
  let best: MockAnswer | null = null
  let bestScore = 0

  for (const item of knowledgeBase) {
    const score = item.keywords.reduce(
      (acc, kw) => (q.includes(kw.toLowerCase()) ? acc + 1 : acc),
      0,
    )
    if (score > bestScore) {
      bestScore = score
      best = item
    }
  }

  return bestScore > 0 && best ? best : fallback
}

/** 模拟流式输出，逐字回调 */
export async function mockAsk(
  question: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<{ answer: string; sources: SourceRef[] }> {
  const { answer, sources } = pickAnswer(question)
  let buffer = ''

  for (const char of answer) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }
    buffer += char
    onChunk(buffer)
    await sleep(12 + Math.random() * 18)
  }

  return { answer, sources }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const suggestedQuestions = [
  '什么是知识库问答 Agent？',
  '如何使用本 Demo？',
  '权限与安全如何设计？',
  '可以对接哪些大模型？',
]
