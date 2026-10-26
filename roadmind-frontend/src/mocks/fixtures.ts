import type { ChatSession, KnowledgeBase, KnowledgeDocument, KnowledgeReference, MaintenanceAdvice, DiseaseCategory } from '@/types/domain'

/** 所有资料、页码、活动和统计均为人工编写的界面样本，不代表真实规范或业务数据。 */
export const knowledgeBases: KnowledgeBase[] = [
  { id: 'pavement', name: '路面养护知识库', description: '汇集路面巡查、常见病害识别与日常养护的示例资料。', category: '日常养护', color: 'blue', updatedAt: '2026-10-26' },
  { id: 'drainage', name: '桥涵与排水设施', description: '围绕桥涵巡查、边沟清理及排水设施管理建立知识参考。', category: '设施管理', color: 'teal', updatedAt: '2026-10-25' },
  { id: 'emergency', name: '应急处置与安全', description: '汛期巡查、异常信息上报与现场安全管理的流程示例。', category: '应急安全', color: 'orange', updatedAt: '2026-10-24' },
  { id: 'inspection', name: '巡查作业与案例', description: '沉淀巡查记录、养护工作单与历史案例的整理方法。', category: '作业管理', color: 'purple', updatedAt: '2026-10-23' },
]

const documentNames = [
  ['路面裂缝巡查手册', '沥青路面日常养护指引', '路面坑槽信息记录模板', '养护作业资料整理说明', '路面病害分类示例', '道路巡查记录示例'],
  ['排水设施日常巡查指引', '桥涵外观检查记录模板', '雨季边沟巡查要点', '涵洞检查资料整理示例', '排水设施台账模板', '设施巡查异常记录'],
  ['汛期道路应急检查要点', '异常情况信息上报示例', '养护作业安全提示', '应急物资台账模板', '恶劣天气巡查记录', '应急工作复盘示例'],
  ['日常巡查记录规范示例', '养护任务归档手册', '路面巡查案例合集', '排水巡查案例合集', '工单信息字段说明', '巡查质量复核清单'],
]

export const documents: KnowledgeDocument[] = knowledgeBases.flatMap((kb, group) =>
  documentNames[group]!.map((name, index) => ({
    id: kb.id + '-doc-' + index,
    knowledgeId: kb.id,
    name: name + (index % 3 === 2 ? '.docx' : '.pdf'),
    format: index % 3 === 2 ? 'DOCX' as const : 'PDF' as const,
    size: (1.2 + index * 0.35) * 1024 * 1024,
    status: group === 1 && index === 3 ? 'processing' as const : group === 2 && index === 5 ? 'failed' as const : 'ready' as const,
    chunks: group === 1 && index === 3 || group === 2 && index === 5 ? 0 : 24 + index * 13,
    updatedAt: '2026-10-' + (26 - index),
    preview: '【演示资料，非实际规范原文】\n\n' + name + '\n\n巡查记录应便于后续核查与资料归档。示例字段包括路段位置、发现时间、现场现象、照片编号和复核记录。\n\n本页面仅展示文档预览的界面结构，没有读取、解析或检索真实文件。',
  })),
)

export const references: KnowledgeReference[] = [
  { id: 'ref-1', title: '路面裂缝巡查手册', knowledgeId: 'pavement', page: 12, chunkId: 'CHK-0012', content: '示例：裂缝巡查记录可包含位置、走向、分布范围及现场照片编号。将现象记录与后续复核结论分别归档，便于追踪变化。' },
  { id: 'ref-2', title: '沥青路面日常养护指引', knowledgeId: 'pavement', page: 8, chunkId: 'CHK-0026', content: '示例：整理路面异常信息时，可关联巡查记录和历史养护资料。具体处置方式需要结合现场复核结果及适用的正式技术文件确定。' },
  { id: 'ref-3', title: '排水设施日常巡查指引', knowledgeId: 'drainage', page: 6, chunkId: 'CHK-0041', content: '示例：排水设施巡查可以记录进出水口情况、淤积现象及周边汇水条件，并附上便于定位的现场资料。' },
  { id: 'ref-4', title: '汛期道路应急检查要点', knowledgeId: 'emergency', page: 4, chunkId: 'CHK-0068', content: '示例：发现道路异常时，记录发现时间、所在路段和现场现象，按既定工作流程完成信息报送和后续跟踪。' },
  { id: 'ref-5', title: '日常巡查记录规范示例', knowledgeId: 'inspection', page: 3, chunkId: 'CHK-0082', content: '示例：巡查记录可按路段、日期及问题类型整理。检查照片、描述和复核记录之间的关联，保持资料完整。' },
  { id: 'ref-6', title: '路面坑槽信息记录模板', knowledgeId: 'pavement', page: 2, chunkId: 'CHK-0094', content: '示例：坑槽记录可补充位置、外观范围、发现时间与现场影像，并关联后续的人员复核和养护工作记录。' },
]

export const suggestedQuestions = [
  '路面出现纵向裂缝，巡查时需要记录哪些信息？',
  '雨季前，排水设施巡查有哪些重点？',
  '如何整理一次日常养护巡查的资料？',
  '发现路面坑槽后，如何完善问题记录？',
]

export const initialSessions: ChatSession[] = [
  { id: 'session-crack', title: '路面裂缝巡查记录要点', knowledgeId: 'pavement', updatedAt: '2026-10-26T02:20:00Z', messages: [
    { id: 'message-1', role: 'user', content: suggestedQuestions[0]!, references: [], status: 'complete' },
    { id: 'message-2', role: 'assistant', content: '可以从以下三个方面整理巡查信息：\n\n1. 现场特征\n记录所在路段、裂缝走向、分布范围及发现时间，补充可定位的现场照片。\n\n2. 相关资料\n关联该路段的历史巡查和养护记录，便于后续核查变化。\n\n3. 后续复核\n将现场观察与专业人员的复核结论分别归档，具体处置依据正式技术文件确定。\n\n以上为预设回复示例，未调用 AI 或检索真实资料。', references: references.slice(0, 2), status: 'complete' },
  ] },
  { id: 'session-drain', title: '雨季排水设施巡查', knowledgeId: 'drainage', updatedAt: '2026-10-25T06:10:00Z', messages: [
    { id: 'message-3', role: 'user', content: suggestedQuestions[1]!, references: [], status: 'complete' },
    { id: 'message-4', role: 'assistant', content: '演示回复：可以整理进出水口、淤积现象及周边汇水条件的记录，并关联现场照片和复核结果。\n\n这是一条预设模板，未进行实际检索或模型调用。', references: [references[2]!], status: 'complete' },
  ] },
  { id: 'session-record', title: '巡查资料归档流程', knowledgeId: 'inspection', updatedAt: '2026-10-24T03:00:00Z', messages: [
    { id: 'message-5', role: 'user', content: suggestedQuestions[2]!, references: [], status: 'complete' },
    { id: 'message-6', role: 'assistant', content: '演示回复：按照路段、日期和问题类型建立记录，将照片、问题描述和后续复核关联归档。\n\n当前内容为人工编写的示例，未调用模型。', references: [references[4]!], status: 'complete' },
  ] },
]

export const activities = [
  { title: '路面养护知识库更新了示例资料', detail: '新增 2 份文档记录', time: '10:24', type: 'document' },
  { title: '完成一次裂缝巡查问答演示', detail: '关联 2 条知识引用', time: '09:48', type: 'chat' },
  { title: '排水巡查资料进入示例解析队列', detail: '演示状态 · 未执行真实任务', time: '09:20', type: 'document' },
  { title: '新增一条日常巡查案例示例', detail: '巡查作业与案例', time: '昨天', type: 'case' },
]

/** 工作台汇总与趋势为预设示例，不对应实时使用量。 */
export const dashboardMetrics = {
  questionCount: 386,
  weekly: [26, 42, 32, 54, 46, 70, 58],
  weeklyLabels: ['10/20', '10/21', '10/22', '10/23', '10/24', '10/25', '10/26'],
  monthly: [18, 30, 26, 44, 37, 56, 61, 74],
  monthlyLabels: ['10/01', '10/05', '10/09', '10/13', '10/17', '10/21', '10/24', '10/26'],
}

export const maintenanceCases = [
  { id: 'case-1', title: '路面纵向裂缝巡查', category: 'crack' as DiseaseCategory, location: '示例路段 A', description: '日常巡查发现示例路段 A 有纵向裂缝，已拍摄现场照片，需要整理巡查记录与后续复核事项。', date: '2026-10-24' },
  { id: 'case-2', title: '雨后边沟淤积记录', category: 'drainage' as DiseaseCategory, location: '示例路段 B', description: '雨后巡查发现示例路段 B 的边沟存在淤积现象，希望梳理需要补充的信息和资料。', date: '2026-10-22' },
  { id: 'case-3', title: '路面局部坑槽记录', category: 'pothole' as DiseaseCategory, location: '示例路段 C', description: '示例路段 C 发现局部坑槽，已记录位置和发现时间，需要补充资料并安排人员复核。', date: '2026-10-20' },
]

export const adviceTemplates: Record<DiseaseCategory, MaintenanceAdvice> = {
  crack: { title: '路面裂缝 · 巡查整理建议', observations: ['路段位置、裂缝走向与分布范围', '发现时间、现场照片及变化记录', '相关历史巡查和养护资料'], suggestions: ['整理现场观察，补齐位置与影像关联。', '由养护人员结合现场情况进行复核。', '根据正式技术依据制定后续工作，并持续记录变化。'], references: references.slice(0, 2) },
  pothole: { title: '路面坑槽 · 信息记录建议', observations: ['所在路段和可定位的现场资料', '外观范围、发现时间和影像编号', '相关路段的历史巡查记录'], suggestions: ['完善问题记录并按既定流程报送。', '安排人员复核现场情况与作业条件。', '将复核结论、后续工作及检查资料关联归档。'], references: [references[5]!, references[1]!] },
  drainage: { title: '排水设施 · 巡查整理建议', observations: ['进出水口及淤积现象', '周边汇水情况与现场影像', '既有设施台账和相关巡查记录'], suggestions: ['整理异常位置、现象及发现时间。', '由养护人员复核设施情况与周边条件。', '依据正式工作流程安排后续工作并记录结果。'], references: [references[2]!, references[3]!] },
  other: { title: '待研判问题 · 资料整理建议', observations: ['异常位置、发现时间与现象描述', '可定位的现场照片', '已有巡查记录及其他相关资料'], suggestions: ['先补全可核查的现场信息。', '提交专业人员进一步分类和复核。', '记录复核结果并关联正式业务流程。'], references: [references[4]!] },
}
