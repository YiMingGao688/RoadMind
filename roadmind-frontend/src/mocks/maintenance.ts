import { adviceTemplates } from './fixtures'
import type { DiseaseCategory } from '@/types/domain'

export interface MaintenanceRequest {
  /** 当前选择的病害类别，综合模式可选择多个。 */
  categories: DiseaseCategory[]
  /** 用户选定的道路类型，仅作为演示上下文。 */
  roadType: string
  /** 现场描述，由界面安全地回显。 */
  description: string
  /** 用户补充说明。 */
  supplement: string
}

/** 按类别返回固定资料整理模板，不作真实病害诊断或维修参数决策。 */
export async function analyzeMaintenance(request: MaintenanceRequest) {
  await new Promise(resolve => setTimeout(resolve, 420))
  const templates = request.categories.map(category => adviceTemplates[category])
  return {
    request: structuredClone(request),
    causes: ['示例假设：现场现象可能涉及既有状况、环境或使用条件，当前信息不足以判断原因。', '需结合现场复核、历史巡查及正式技术依据进一步核实，不能从本模板推断病害等级。'],
    inspections: [...new Set(templates.flatMap(template => template.observations))],
    suggestions: [...new Set(templates.flatMap(template => template.suggestions))],
    references: [...new Map(templates.flatMap(template => template.references).map(reference => [reference.id, reference])).values()],
  }
}
