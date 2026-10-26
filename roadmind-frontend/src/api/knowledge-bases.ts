import { request } from './http'
import type { PageResponse } from '@/types/api'
import type { KnowledgeBaseInput, KnowledgeBaseQuery, KnowledgeBaseRecord } from '@/types/knowledge-api'

/** 只访问真实 Spring Boot API，不导入 Mock 数据或做失败降级伪装。 */
export function listKnowledgeBases(params: KnowledgeBaseQuery, signal?: AbortSignal) {
  return request<PageResponse<KnowledgeBaseRecord>>({ url: '/knowledge-bases', method: 'GET', params, signal })
}

/** 按真实主键获取详情。 */
export function getKnowledgeBase(id: string, signal?: AbortSignal) {
  return request<KnowledgeBaseRecord>({ url: '/knowledge-bases/' + encodeURIComponent(id), method: 'GET', signal })
}

/** 创建成功由后端返回主键，前端不生成模拟记录。 */
export function createKnowledgeBase(data: KnowledgeBaseInput) {
  return request<KnowledgeBaseRecord>({ url: '/knowledge-bases', method: 'POST', data })
}

/** 修改成功后由页面重新读取后端数据。 */
export function updateKnowledgeBase(id: string, data: KnowledgeBaseInput) {
  return request<KnowledgeBaseRecord>({ url: '/knowledge-bases/' + encodeURIComponent(id), method: 'PUT', data })
}

/** 后端执行逻辑删除，不在前端伪造成功。 */
export function deleteKnowledgeBase(id: string) {
  return request<null>({ url: '/knowledge-bases/' + encodeURIComponent(id), method: 'DELETE' })
}
