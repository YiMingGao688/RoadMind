import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { demoChatSessions } from '@/mocks/chat'
import { mockChatTransport } from '@/mocks/services'
import type { ChatMessage, ChatSession } from '@/types/domain'

/** 会话状态独立于界面；统一流消费可在未来替换为真实 SSE 适配器。 */
export const useChatStore = defineStore('chat', () => {
  const sessions = ref<ChatSession[]>(demoChatSessions())
  const activeId = ref(sessions.value[0]!.id)
  const isStreaming = ref(false)
  const activeSession = computed(() => sessions.value.find(session => session.id === activeId.value))
  const activeReferences = computed(() => [...(activeSession.value?.messages || [])].reverse().find(message => message.role === 'assistant')?.references || [])
  let controller: AbortController | null = null

  function stop() { controller?.abort(); controller = null; isStreaming.value = false }
  function select(id: string) { if (!sessions.value.some(session => session.id === id)) return; stop(); activeId.value = id }
  function createSession(knowledgeId = 'all') {
    stop()
    const session: ChatSession = { id: crypto.randomUUID(), title: '新对话', knowledgeId, messages: [], updatedAt: new Date().toISOString() }
    sessions.value.unshift(session)
    activeId.value = session.id
  }
  function removeSession(id: string) {
    if (id === activeId.value) stop()
    sessions.value = sessions.value.filter(session => session.id !== id)
    if (activeId.value === id) { if (sessions.value[0]) activeId.value = sessions.value[0].id; else createSession() }
  }

  /** 只更新捕获的消息对象，防止历史切换或中断后把增量写入其他会话。 */
  async function playReply(session: ChatSession, reply: ChatMessage, question: string, simulateError = false) {
    const currentController = new AbortController()
    controller = currentController
    isStreaming.value = true
    try {
      for await (const event of mockChatTransport.stream({ sessionId: session.id, question, knowledgeId: session.knowledgeId, simulateError }, currentController.signal)) {
        if (event.type === 'delta') reply.content += event.text
        else if (event.type === 'references') reply.references = event.references
        else reply.status = 'complete'
      }
    } catch {
      reply.status = currentController.signal.aborted ? 'stopped' : 'error'
      if (reply.status === 'error') reply.content = '演示服务暂不可用，请点击重试。这是前端错误状态示例，未调用真实模型。'
      else if (!reply.content) reply.content = '演示回复已停止。'
    } finally {
      session.updatedAt = new Date().toISOString()
      if (controller === currentController) { controller = null; isStreaming.value = false }
    }
  }

  /** 保存用户消息后播放固定模板，显式错误演示仅作用于本次请求。 */
  async function send(question: string, options: { simulateError?: boolean } = {}) {
    if (isStreaming.value || !question.trim()) return
    if (!activeSession.value) createSession()
    const session = activeSession.value!
    if (!session.messages.length) session.title = question.trim().slice(0, 24)
    session.messages.push({ id: crypto.randomUUID(), role: 'user', content: question.trim(), references: [], status: 'complete' })
    session.messages.push({ id: crypto.randomUUID(), role: 'assistant', content: '', references: [], status: 'streaming' })
    await playReply(session, session.messages[session.messages.length - 1]!, question, options.simulateError)
  }

  /** 原位重播助手消息，保留前一条问题，避免重试产生重复的用户记录。 */
  async function retry(id: string) {
    const session = activeSession.value
    if (!session || isStreaming.value) return
    const index = session.messages.findIndex(message => message.id === id && message.role === 'assistant')
    const reply = session.messages[index]
    const question = session.messages.slice(0, index).reverse().find(message => message.role === 'user')?.content
    if (!reply || !question) return
    reply.content = ''; reply.references = []; reply.status = 'streaming'
    await playReply(session, reply, question)
  }
  function reset() { stop(); sessions.value = demoChatSessions(); activeId.value = sessions.value[0]!.id }
  return { sessions, activeId, activeSession, activeReferences, isStreaming, select, createSession, removeSession, send, retry, stop, reset }
})