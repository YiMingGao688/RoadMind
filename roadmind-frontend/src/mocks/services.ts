import type { ChatTransport } from '@/types/chat'
import type { RetrievalOptions, RetrievalResult } from '@/types/domain'
import { references } from './fixtures'
import { mockReply } from './chat'

/** 模拟播放延时支持中断，完成或中断时都会清理监听器。 */
function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('演示已停止', 'AbortError'))
    const onAbort = () => { clearTimeout(timer); reject(new DOMException('演示已停止', 'AbortError')) }
    const timer = setTimeout(() => { signal.removeEventListener('abort', onAbort); resolve() }, ms)
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

/** 固定模板分段播放，不发起网络请求，也不宣称真实 SSE 或模型生成。 */
export const mockChatTransport: ChatTransport = {
  async *stream(request, signal) {
    const { content: text, references: citations } = mockReply(request.question, request.knowledgeId)
    await wait(350, signal)
    if (request.simulateError) throw new Error('演示服务暂不可用')
    yield { type: 'references', references: citations }
    for (let offset = 0; offset < text.length; offset += 7) {
      await wait(28, signal)
      yield { type: 'delta', text: text.slice(offset, offset + 7) }
    }
    yield { type: 'done' }
  },
}

/** 用可复现规则演示筛选、排序和 Top K，不计算真实向量或 Rerank。 */
export function runMockRetrieval(options: RetrievalOptions): RetrievalResult {
  const candidates = references.filter(ref => options.knowledgeId === 'all' || ref.knowledgeId === options.knowledgeId)
  const hits = candidates.map((ref, index) => {
    const keywordBonus = options.query.includes('排水') && ref.knowledgeId === 'drainage' || options.query.includes('裂缝') && ref.id === 'ref-1' ? 0.05 : 0
    const strategyBonus = options.strategy === 'hybrid' && options.rrf !== false ? 0.03 : options.strategy === 'keyword' ? keywordBonus : 0
    const similarity = Math.min(0.97, 0.89 - index * 0.075 + keywordBonus + strategyBonus)
    return { ...ref, similarity, rerankScore: options.rerank ? Math.min(0.98, similarity + (index % 2 === 1 ? 0.09 : -0.02)) : null }
  }).filter(hit => hit.similarity >= options.threshold)
    .sort((a, b) => (b.rerankScore ?? b.similarity) - (a.rerankScore ?? a.similarity)).slice(0, options.topK)
  return {
    options: { ...options }, hits,
    timings: [
      { label: '查询准备', milliseconds: 24 },
      { label: options.strategy === 'hybrid' ? '混合召回' : options.strategy === 'vector' ? '向量召回' : '关键词召回', milliseconds: options.strategy === 'hybrid' ? 132 : 86 },
      { label: 'RRF 融合', milliseconds: options.strategy === 'hybrid' && options.rrf !== false ? 16 : 0 },
      { label: '重排序', milliseconds: options.rerank ? 96 : 0 },
      { label: '结果整理', milliseconds: 18 },
    ],
  }
}
