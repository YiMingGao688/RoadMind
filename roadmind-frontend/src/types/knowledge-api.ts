/** 当前知识库分类沿用既有前端业务值，不建立模拟用户或权限关系。 */
export type KnowledgeCategory = '日常养护' | '设施管理' | '应急安全' | '作业管理'

export interface KnowledgeBaseRecord {
  /** 后端返回的十进制字符串主键。 */
  id: string
  /** 实际持久化的名称。 */
  name: string
  /** 实际持久化的知识范围。 */
  description: string
  /** 后端校验的业务分类。 */
  category: KnowledgeCategory
  /** 后端文档数，本阶段为 0。 */
  documentCount: number
  /** UTC 创建时间。 */
  createdAt: string
  /** UTC 最近修改时间。 */
  updatedAt: string
}

export interface KnowledgeBaseInput {
  /** 去除首尾空白后为 1–40 个字符。 */
  name: string
  /** 可为空，最多 160 个字符。 */
  description: string
  /** 当前支持的分类。 */
  category: KnowledgeCategory
}

export interface KnowledgeBaseQuery {
  /** 从 1 开始的页码。 */
  page: number
  /** 单页数量，后端上限为 100。 */
  size: number
  /** 可选的名称关键词。 */
  keyword?: string
  /** 可选的精确分类。 */
  category?: KnowledgeCategory
}
