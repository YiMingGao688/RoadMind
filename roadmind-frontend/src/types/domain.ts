/** 知识库卡片展示模型，页面负责明确区分真实 API 与独立演示来源。 */
export interface KnowledgeBase {
  /** 后端字符串主键或独立演示标识，不把两者合并存储。 */
  id: string
  /** 用户可见的知识库名称。 */
  name: string
  /** 知识内容范围。 */
  description: string
  /** 页面分类筛选使用的主题。 */
  category: string
  /** 图标配色标识。 */
  color: 'blue' | 'teal' | 'orange' | 'purple'
  /** 页面格式化后的展示更新时间。 */
  updatedAt: string
}

/** local 只表示本地文件信息登记，永远不自动变成已上传或已索引。 */
export type DocumentStatus = 'ready' | 'processing' | 'failed' | 'local'
export interface KnowledgeDocument {
  /** 演示文档标识。 */
  id: string
  /** 所属知识库。 */
  knowledgeId: string
  /** 展示文件名，不代表服务器存在同名文件。 */
  name: string
  /** 支持展示的文件扩展名。 */
  format: 'PDF' | 'DOCX' | 'DOC'
  /** 文件字节数或演示样本大小。 */
  size: number
  /** 预设示例状态或本地待上传状态。 */
  status: DocumentStatus
  /** 预设片段数；本地文件始终为 0。 */
  chunks: number
  /** 展示更新时间。 */
  updatedAt: string
  /** 示例内容，本地文件没有解析内容。 */
  preview: string
}

export interface KnowledgeReference {
  /** 引用标识，用于聊天与侧栏联动。 */
  id: string
  /** 对应的示例资料名称。 */
  title: string
  /** 所属演示知识库。 */
  knowledgeId: string
  /** 示例页码，不代表真实文档定位。 */
  page: number
  /** 示例片段标识。 */
  chunkId: string
  /** 人工编写的演示片段，并非实际规范原文。 */
  content: string
}

export interface ChatMessage {
  /** 本地消息标识。 */
  id: string
  /** 消息展示角色。 */
  role: 'user' | 'assistant'
  /** 用户内容按文本展示；助手内容使用禁用原始 HTML 的 Markdown 渲染。 */
  content: string
  /** 关联的演示引用。 */
  references: KnowledgeReference[]
  /** 演示播放状态，支持中断及失败提示。 */
  status: 'streaming' | 'complete' | 'stopped' | 'error'
}
export interface ChatSession {
  /** 本地会话标识。 */
  id: string
  /** 从首条用户消息生成的标题。 */
  title: string
  /** 当前会话选择的知识库，all 表示全部。 */
  knowledgeId: string
  /** 会话消息列表。 */
  messages: ChatMessage[]
  /** ISO 格式的更新时间。 */
  updatedAt: string
}
export type RetrievalStrategy = 'hybrid' | 'vector' | 'keyword'
export interface RetrievalOptions {
  /** 用户输入的演示检索问题。 */
  query: string
  /** 限制演示候选集的知识库。 */
  knowledgeId: string
  /** 展示的检索策略。 */
  strategy: RetrievalStrategy
  /** 混合模式是否演示 RRF 融合；不执行真实排名融合计算。 */
  rrf?: boolean
  /** 最大返回片段数。 */
  topK: number
  /** 演示相似度过滤阈值。 */
  threshold: number
  /** 是否按照预设的重排序分数排序。 */
  rerank: boolean
}
export interface RetrievalHit extends KnowledgeReference {
  /** 演示相似度，不是向量库计算结果。 */
  similarity: number
  /** 演示重排序分数，未启用时为空。 */
  rerankScore: number | null
}
export interface RetrievalResult {
  /** 本次展示使用的参数快照。 */
  options: RetrievalOptions
  /** 经过演示规则排序、过滤的片段。 */
  hits: RetrievalHit[]
  /** 各阶段的预设耗时，非实际服务性能。 */
  timings: { label: string; milliseconds: number }[]
}

export type DiseaseCategory = 'crack' | 'pothole' | 'drainage' | 'other'
export interface MaintenanceAdvice {
  /** 当前分类对应的演示标题。 */
  title: string
  /** 需要补充记录的信息示例。 */
  observations: string[]
  /** 固定养护工作流程模板，未进行真实病害诊断。 */
  suggestions: string[]
  /** 相关演示资料。 */
  references: KnowledgeReference[]
}
