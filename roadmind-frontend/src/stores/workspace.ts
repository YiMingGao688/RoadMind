import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { documents as fixtureDocuments, knowledgeBases as fixtureKnowledgeBases } from '@/mocks/fixtures'
import type { KnowledgeBase, KnowledgeDocument } from '@/types/domain'

/** 仅维护内存中的演示工作空间，刷新即恢复样本，不调用真实业务 API。 */
export const useWorkspaceStore = defineStore('workspace', () => {
  const knowledgeBases = ref<KnowledgeBase[]>(structuredClone(fixtureKnowledgeBases))
  const documents = ref<KnowledgeDocument[]>(structuredClone(fixtureDocuments))
  const readyCount = computed(() => documents.value.filter(doc => doc.status === 'ready').length)

  /** 创建本地卡片，校验名称并阻止重复；不表示服务器已创建知识库。 */
  function createKnowledge(name: string, description: string, category: string): KnowledgeBase {
    const normalizedName = name.trim()
    if (!normalizedName || normalizedName.length > 40) throw new Error('知识库名称需为 1–40 个字符')
    if (knowledgeBases.value.some(kb => kb.name === normalizedName)) throw new Error('已有同名演示知识库')
    const kb: KnowledgeBase = { id: crypto.randomUUID(), name: normalizedName, description: description.trim(), category, color: 'blue', updatedAt: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' }) }
    knowledgeBases.value.unshift(kb)
    return kb
  }

  /** 仅登记文件元数据，状态固定为 local，不读取、上传或解析文件内容。 */
  function addLocalDocuments(knowledgeId: string, files: File[]): number {
    let added = 0
    for (const file of files) {
      if (documents.value.some(doc => doc.knowledgeId === knowledgeId && doc.name === file.name)) continue
      const extension = file.name.split('.').pop()?.toUpperCase()
      if (!['PDF', 'DOCX', 'DOC'].includes(extension || '') || file.size > 20 * 1024 * 1024) continue
      documents.value.unshift({ id: crypto.randomUUID(), knowledgeId, name: file.name, format: extension as KnowledgeDocument['format'], size: file.size, status: 'local', chunks: 0, updatedAt: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' }), preview: '' })
      added++
    }
    return added
  }

  function reset() {
    knowledgeBases.value = structuredClone(fixtureKnowledgeBases)
    documents.value = structuredClone(fixtureDocuments)
  }
  return { knowledgeBases, documents, readyCount, createKnowledge, addLocalDocuments, reset }
})
