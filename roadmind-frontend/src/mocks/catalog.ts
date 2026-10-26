import type { KnowledgeBase, KnowledgeDocument, KnowledgeReference } from '@/types/domain'
import type { KnowledgeKind, PreviewDocument } from '@/types/knowledge'
import { references } from './fixtures'

export const knowledgeKinds: { value: KnowledgeKind | 'all'; label: string }[] = [
  { value: 'all', label: '全部' }, { value: 'technical', label: '技术规范' },
  { value: 'case', label: '工程案例' }, { value: 'guide', label: '行业指南' },
  { value: 'internal', label: '内部资料' },
]
export function knowledgeKind(category: string): KnowledgeKind {
  return category === '日常养护' ? 'technical' : category === '作业管理' ? 'case' : category === '应急安全' ? 'internal' : 'guide'
}
export function kindLabel(kind: KnowledgeKind): string { return knowledgeKinds.find(item => item.value === kind)?.label || '资料' }

/** 仅把已有演示记录转换为预览模型，不伪造可阅读的原始 PDF。 */
export function previewDocument(document: KnowledgeDocument, bases: KnowledgeBase[]): PreviewDocument {
  const base = bases.find(item => item.id === document.knowledgeId)
  const title = document.name.replace(/\.(pdf|docx?)$/i, '')
  const related = references.filter(reference => reference.title === title)
  const localOnly = document.status === 'local'
  const sections = localOnly ? [] : related.length ? related.map(reference => ({ id: reference.chunkId, title: '相关知识片段', page: reference.page, content: reference.content })) : [
    { id: document.id + '-record', title: '巡查信息记录示例', page: 1, content: '演示片段：记录路段位置、发现时间、现场现象和影像资料，并关联后续复核记录。此内容为手工编写的界面样本，不是正式规范原文。' },
    { id: document.id + '-review', title: '资料关联与复核示例', page: 2, content: '演示片段：将问题描述、巡查照片与历史养护记录关联整理，由专业人员结合现场情况复核。具体业务结论应依据适用的正式技术文件。' },
    { id: document.id + '-scope', title: '资料使用范围', page: 3, content: '当前没有载入原始 PDF 或 Word。页面只演示章节定位、知识引用与跳转问答，不提供完整文档阅读能力。' },
  ]
  return { id: document.id, title, knowledgeId: document.knowledgeId, knowledgeName: base?.name || '演示知识库', kind: knowledgeKind(base?.category || ''), format: document.format, summary: localOnly ? '仅登记文件信息，尚未上传或解析。' : sections[0]?.content || '演示资料', updatedAt: document.updatedAt, source: 'RoadMind 手写演示资料', sections, localOnly }
}

/** 引用通过标题关联现有记录；无对应文件时仅展示该引用的示例片段。 */
export function previewReference(reference: KnowledgeReference, documents: KnowledgeDocument[], bases: KnowledgeBase[]): PreviewDocument {
  const document = documents.find(item => item.knowledgeId === reference.knowledgeId && item.name.replace(/\.(pdf|docx?)$/i, '') === reference.title)
  if (document) return previewDocument(document, bases)
  return { id: reference.id, title: reference.title, knowledgeId: reference.knowledgeId, knowledgeName: bases.find(base => base.id === reference.knowledgeId)?.name || '演示知识库', kind: 'technical', format: 'PDF', summary: reference.content, updatedAt: '2026-10-26', source: 'RoadMind 手写演示引用', sections: [{ id: reference.chunkId, title: '相关知识片段', page: reference.page, content: reference.content }], localOnly: false }
}

/** 浏览器中的关键词筛选，不执行语义检索或访问后端。 */
export async function searchKnowledge(query: string, kind: KnowledgeKind | 'all', documents: KnowledgeDocument[], bases: KnowledgeBase[]): Promise<PreviewDocument[]> {
  await new Promise(resolve => setTimeout(resolve, 180))
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  return documents.filter(document => document.status === 'ready').map(document => previewDocument(document, bases))
    .filter(document => (kind === 'all' || document.kind === kind) && (!tokens.length || tokens.some(token => (document.title + document.summary + document.knowledgeName).toLowerCase().includes(token))))
}
