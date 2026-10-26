import { request } from './http'
import type { HealthPayload } from '@/types/api'

/** 唯一已存在的后端 API；仅在用户主动测试连接时调用。 */
export function getBackendHealth(): Promise<HealthPayload> {
  return request<HealthPayload>({ url: '/health', method: 'GET' })
}
