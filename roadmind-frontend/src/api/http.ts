import axios, { type AxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types/api'

/** 真实网络请求入口；不导入 mocks，不通过拦截器伪造成功响应。 */
const http = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api', timeout: 10_000 })

/** 保留 HTTP 状态用于页面区分不存在与连接失败，消息只来自公开响应。 */
export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); this.name = 'ApiError' }
}

/** 统一检查后端业务状态，页面自行决定错误提示方式。 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const { data } = await http.request<ApiResponse<T>>(config)
    if (data.code !== 0) throw new ApiError(data.message || '请求失败', 200)
    return data.data
  } catch (error) {
    if (axios.isCancel(error)) throw error
    if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
      const status = error.response?.status || 0
      const message = error.response?.data?.message
      throw new ApiError(typeof message === 'string' && message ? message : status ? '请求失败，请稍后重试' : '无法连接后端服务，请检查服务是否已启动', status)
    }
    throw error
  }
}
