/** 对齐第一阶段后端 ApiResponse，业务 DTO 后续按真实接口定义补充。 */
export interface ApiResponse<T> {
  /** 0 表示成功。 */
  code: number
  /** 服务端公开提示。 */
  message: string
  /** 业务返回数据。 */
  data: T
  /** 服务端 UTC 响应时间。 */
  timestamp: string
}
export interface HealthPayload {
  /** 后端应用名称。 */
  application: string
  /** 应用存活状态。 */
  status: string
}

/** 对齐后端 PageResponse，避免暴露 MyBatis-Plus 内部模型。 */
export interface PageResponse<T> {
  /** 当前页记录。 */
  records: T[]
  /** 当前筛选条件下的总数。 */
  total: number
  /** 从 1 开始的页码。 */
  page: number
  /** 本页请求数量。 */
  size: number
}
