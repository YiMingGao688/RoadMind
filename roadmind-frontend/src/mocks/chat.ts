import { adviceTemplates, initialSessions, references } from './fixtures'
import type { DiseaseCategory } from '@/types/domain'

/** 结构化文本来自固定工作流程模板，标题和引用均明确为演示内容。 */
export function mockReply(question: string, knowledgeId: string) {
  const category: DiseaseCategory = /排水|雨|边沟/.test(question) ? 'drainage' : /坑槽/.test(question) ? 'pothole' : /裂缝/.test(question) ? 'crack' : 'other'
  const template = adviceTemplates[category]
  const citations = knowledgeId === 'all' ? template.references : references.filter(reference => reference.knowledgeId === knowledgeId).slice(0, 2)
  const content = '### 问题分析\n\n以下为预设工作流程示例，先整理可核查的现场信息，再关联资料与复核记录。未对现场情况进行真实判断。\n\n### 参考依据\n\n' + (citations.length ? citations.map((reference, index) => '- [' + (index + 1) + '] ' + reference.title + '（演示片段）').join('\n') : '当前知识范围没有对应的演示引用。') + '\n\n### 处置建议\n\n' + template.suggestions.map((item, index) => (index + 1) + '. ' + item).join('\n') + '\n\n### 注意事项\n\n- 补充记录：' + template.observations.join('、') + '。\n- 具体处置需由专业人员结合现场情况与正式技术文件复核。\n- **当前没有调用 AI，也没有检索真实资料。**'
  return { content, references: citations }
}

export function demoChatSessions() {
  const sessions = structuredClone(initialSessions)
  for (const session of sessions) for (let index = 0; index < session.messages.length; index++) {
    const message = session.messages[index]!
    if (message.role !== 'assistant') continue
    const reply = mockReply(session.messages[index - 1]?.content || session.title, session.knowledgeId)
    message.content = reply.content
    message.references = reply.references
  }
  return sessions
}
