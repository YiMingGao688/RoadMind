import { ref } from 'vue'
import { defineStore } from 'pinia'
export type KnowledgeDataMode = 'real' | 'demo'
const storageKey = 'roadmind-knowledge-mode'

/** 只保存用户选择的数据来源，不把真实记录写入演示 workspace。 */
export const useKnowledgeModeStore = defineStore('knowledge-mode', () => {
  function initialMode(): KnowledgeDataMode {
    try { return localStorage.getItem(storageKey) === 'demo' ? 'demo' : 'real' }
    catch { return 'real' }
  }
  const mode = ref<KnowledgeDataMode>(initialMode())
  function setMode(value: KnowledgeDataMode) {
    mode.value = value
    try { localStorage.setItem(storageKey, value) } catch { /* 存储受限时仍保持本次页面会话的明确选择。 */ }
  }
  return { mode, setMode }
})
