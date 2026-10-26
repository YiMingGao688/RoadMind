import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'

/** 首页、搜索和资料预览共同使用的会话跳转，避免问题与知识范围丢失。 */
export function useAssistantNavigation() {
  const router = useRouter()
  const chat = useChatStore()
  async function ask(question: string, knowledgeId = 'all') {
    if (!question.trim()) return
    chat.createSession(knowledgeId)
    await router.push('/chat')
    void chat.send(question.trim())
  }
  async function newConversation() { chat.createSession(); await router.push('/chat') }
  return { ask, newConversation }
}
