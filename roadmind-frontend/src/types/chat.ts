import type { KnowledgeReference } from './domain'

/** 前端流式适配契约；未来 SSE 事件需由真实 API 适配器转换，尚非后端协议。 */
export interface ChatRequest {
  /** 本地会话标识。 */
  sessionId: string
  /** 用户问题。 */
  question: string
  /** 所选知识库。 */
  knowledgeId: string
  /** 仅用于用户主动触发的错误状态演示，不传给真实业务接口。 */
  simulateError?: boolean
}
export type ChatStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'references'; references: KnowledgeReference[] }
  | { type: 'done' }

/** UI 消费统一异步事件；真实实现可读取 fetch + ReadableStream 并处理 AbortSignal。 */
export interface ChatTransport {
  stream(request: ChatRequest, signal: AbortSignal): AsyncIterable<ChatStreamEvent>
}
