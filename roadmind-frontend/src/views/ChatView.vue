<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { ElButton, ElDrawer, ElInput, ElDropdown, ElDropdownMenu, ElDropdownItem, ElMessage } from 'element-plus'
import { Collection, Close, MoreHorizontal, EditPen, Download, Plus } from '@/components/icons'
import ChatComposer from '@/components/ChatComposer.vue'
import MessageItem from '@/components/ChatMessage.vue'
import SourceCitation from '@/components/SourceCitation.vue'
import DocumentPreview from '@/components/DocumentPreview.vue'
import { previewReference } from '@/mocks/catalog'
import { useChatStore } from '@/stores/chat'
import { useWorkspaceStore } from '@/stores/workspace'
import { suggestedQuestions } from '@/mocks/fixtures'
import type { KnowledgeReference } from '@/types/domain'
import type { PreviewDocument } from '@/types/knowledge'
import logo from '@/assets/logo.svg'
const chat = useChatStore()
const workspace = useWorkspaceStore()
const sourcesOpen = ref(true)
const mobileSources = ref(false)
const documentOpen = ref(false)
const selectedDocument = ref<PreviewDocument | null>(null)
const selectedReference = ref('')
const selectedChunk = ref('')
const messageContainer = ref<HTMLElement>()
const renaming = ref(false)
const title = ref('')
const knowledgeId = computed({ get: () => chat.activeSession?.knowledgeId || 'all', set: value => { if (chat.activeSession) chat.activeSession.knowledgeId = value } })
function send(text: string) { void chat.send(text) }
function openReference(reference: KnowledgeReference) { selectedReference.value = reference.id; selectedChunk.value = reference.chunkId; selectedDocument.value = previewReference(reference, workspace.documents, workspace.knowledgeBases); documentOpen.value = true }
function toggleSources() { if (window.innerWidth < 1100) mobileSources.value = true; else sourcesOpen.value = !sourcesOpen.value }
function beginRename() { title.value = chat.activeSession?.title || '新对话'; renaming.value = true }
function saveTitle() { if (chat.activeSession && title.value.trim()) chat.activeSession.title = title.value.trim().slice(0, 40); renaming.value = false }
async function action(command: string) {
  if (command === 'error') { if (chat.isStreaming) return; await chat.send('演示一条服务暂不可用的错误状态。', { simulateError: true }) }
  else if (command === 'new') chat.createSession()
  else {
    const text = chat.activeSession?.messages.map(message => (message.role === 'user' ? '用户：' : 'RoadMind（演示）：') + message.content).join('\n\n') || ''
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' }); const url = URL.createObjectURL(blob)
    const link = document.createElement('a'); link.href = url; link.download = 'RoadMind-演示对话.md'; link.click(); URL.revokeObjectURL(url)
    ElMessage.success('已导出本地演示对话')
  }
}
watch(() => [chat.activeId, chat.activeSession?.messages.at(-1)?.content], async () => { await nextTick(); if (messageContainer.value) messageContainer.value.scrollTop = messageContainer.value.scrollHeight })
watch(() => chat.activeId, () => { selectedReference.value = ''; sourcesOpen.value = true })
onUnmounted(() => chat.stop())
</script>
<template>
  <div class="ai-chat-page"><header class="chat-titlebar"><div class="chat-title"><ElInput v-if="renaming" v-model="title" maxlength="40" aria-label="对话标题" @keyup.enter="saveTitle" @blur="saveTitle" /><h1 v-else>{{ chat.activeSession?.title || '新对话' }}</h1><button class="icon-button" aria-label="修改对话标题" @click="beginRename"><EditPen /></button></div><div><span class="demo-badge">Mock 演示</span><ElButton :icon="Collection" aria-label="切换引用来源" @click="toggleSources">引用来源</ElButton><ElDropdown trigger="click" @command="action"><button class="icon-button" aria-label="更多对话操作"><MoreHorizontal /></button><template #dropdown><ElDropdownMenu><ElDropdownItem command="new" :icon="Plus">新建对话</ElDropdownItem><ElDropdownItem command="export" :icon="Download">导出本地对话</ElDropdownItem><ElDropdownItem command="error">演示错误状态</ElDropdownItem></ElDropdownMenu></template></ElDropdown></div></header><div class="chat-columns" :class="{ 'sources-hidden': !sourcesOpen }"><section class="chat-conversation"><div ref="messageContainer" class="chat-message-scroll" aria-live="polite"><div v-if="!chat.activeSession?.messages.length" class="chat-empty-welcome"><img :src="logo" alt="" /><h2>开始一次有依据的知识对话</h2><p>选择知识范围，输入问题，体验带来源引用的演示回答。</p><div><button v-for="question in suggestedQuestions" :key="question" @click="send(question)">{{ question }}</button></div></div><MessageItem v-for="message in chat.activeSession?.messages" :key="message.id" :message="message" :busy="chat.isStreaming" @citation="openReference" @retry="chat.retry" /></div><div class="chat-composer-dock"><ChatComposer v-model:knowledge-id="knowledgeId" :loading="chat.isStreaming" @send="send" @stop="chat.stop" /><p>回复与引用为预设演示，不代表真实模型输出。</p></div></section><aside v-if="sourcesOpen" class="chat-source-panel"><div class="source-panel-heading"><div><h2>引用来源</h2><span>{{ chat.activeReferences.length }} 个演示片段</span></div><button class="icon-button" aria-label="关闭引用来源" @click="sourcesOpen = false"><Close /></button></div><SourceCitation v-for="(reference, index) in chat.activeReferences" :key="reference.id" :reference="reference" :index="index" :active="selectedReference === reference.id" @open="openReference" /><p v-if="!chat.activeReferences.length" class="source-empty-note">回答关联的演示片段将在这里展示。</p><p class="source-boundary">文档标题、页码及内容均为手写样本，非真实规范原文。</p></aside></div><ElDrawer v-model="mobileSources" title="引用来源" size="360px" class="responsive-drawer"><SourceCitation v-for="(reference, index) in chat.activeReferences" :key="reference.id" :reference="reference" :index="index" @open="openReference" /></ElDrawer><ElDrawer v-model="documentOpen" title="引用资料详情" size="560px" class="responsive-drawer"><DocumentPreview :document="selectedDocument" :active-section="selectedChunk" expanded @ask="document => { documentOpen = false; send('请继续说明《' + document.title + '》的巡查记录要点。') }" /></ElDrawer></div>
</template>