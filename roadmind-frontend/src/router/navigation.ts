import { ChatDotRound, Search, Tools, Reading, FlaskConical } from '@/components/icons'

/** 六页面共用的 AI 应用导航；对话属于首页助手入口的会话状态。 */
export const navigationItems = [
  { label: 'AI 智能助手', path: '/dashboard', icon: ChatDotRound, description: '行业知识问答与专业助手' },
  { label: '知识探索', path: '/explore', icon: Search, description: '资料搜索与文档预览' },
  { label: '公路养护助手', path: '/maintenance', icon: Tools, description: '病害信息与工作建议' },
  { label: '我的知识库', path: '/knowledge', icon: Reading, description: '管理知识空间和文档' },
  { label: 'RAG 实验室', path: '/rag', icon: FlaskConical, description: '检索配置、评分与分析' },
]
