import type { KnowledgeDocument } from './domain'

/** 前端演示资料分类，后续应按正式 API 枚举映射。 */
export type KnowledgeKind = 'technical' | 'case' | 'guide' | 'internal'
export interface DocumentSection {
  /** 预览片段标识。 */
  id: string
  /** 演示章节名称，不使用未经核对的规范条款号。 */
  title: string
  /** 明确标记为示例的页码。 */
  page: number
  /** 手工编写的示例内容。 */
  content: string
}
export interface PreviewDocument {
  /** 对应演示文档或引用的标识。 */
  id: string
  /** 资料标题。 */
  title: string
  /** 所属知识库标识。 */
  knowledgeId: string
  /** 所属知识库名称。 */
  knowledgeName: string
  /** 搜索分类。 */
  kind: KnowledgeKind
  /** 文件格式。 */
  format: KnowledgeDocument['format']
  /** 内容简介，全部来自演示资料。 */
  summary: string
  /** 展示更新时间。 */
  updatedAt: string
  /** 资料来源，明确区分手写示例和真实来源。 */
  source: string
  /** 可定位的演示章节。 */
  sections: DocumentSection[]
  /** 是否只登记了本地文件信息。 */
  localOnly: boolean
  /** 为后续原始文件与 PDF.js 适配预留，当前不设置或请求。 */
  originalUrl?: string
}
