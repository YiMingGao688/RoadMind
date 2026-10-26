<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus'
import { Plus, PanelLeftClose, PanelLeftOpen, MoreHorizontal, ArrowDown } from './icons'
import { navigationItems } from '@/router/navigation'
import { useChatStore } from '@/stores/chat'
import { useKnowledgeModeStore } from '@/stores/knowledge-mode'
import { useAssistantNavigation } from '@/composables/useAssistantNavigation'
import logo from '@/assets/logo.svg'
defineProps<{ collapsed: boolean; mobileOpen: boolean }>()
const emit = defineEmits<{ collapse: []; help: []; reset: [] }>()
const route = useRoute()
const router = useRouter()
const chat = useChatStore()
const knowledgeSource = useKnowledgeModeStore()
const realKnowledge = computed(() => route.path.startsWith('/knowledge') && knowledgeSource.mode === 'real')
const assistant = useAssistantNavigation()
const recent = computed(() => chat.sessions.filter(session => session.messages.length).slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8))
function active(path: string) { return path === '/dashboard' ? route.path === '/dashboard' || route.path === '/chat' : route.path.startsWith(path) }
function openSession(id: string) { chat.select(id); void router.push('/chat') }
function accountAction(command: string) { if (command === 'reset') emit('reset'); else emit('help') }
</script>
<template>
  <aside class="app-sidebar" :class="{ 'mobile-open': mobileOpen }" aria-label="主导航"><div class="ai-brand-row"><RouterLink to="/dashboard" class="ai-brand" aria-label="RoadMind 首页"><img :src="logo" alt="" /><span class="sidebar-label"><strong>RoadMind</strong><small>智路知枢</small></span></RouterLink><button class="sidebar-collapse" :aria-label="collapsed ? '展开侧栏' : '折叠侧栏'" @click="emit('collapse')"><PanelLeftOpen v-if="collapsed" /><PanelLeftClose v-else /></button></div><ElButton type="primary" :icon="Plus" class="sidebar-new-chat" aria-label="新建对话" @click="assistant.newConversation"><span class="sidebar-label">新建对话</span></ElButton><nav class="ai-navigation"><RouterLink v-for="item in navigationItems" :key="item.path" :to="item.path" :title="item.label" :aria-label="item.label" :aria-current="active(item.path) ? 'page' : undefined" :class="{ active: active(item.path) }"><component :is="item.icon" /><span class="sidebar-label">{{ item.label }}</span></RouterLink></nav><section class="sidebar-history sidebar-label"><div><span>最近对话</span><button class="icon-button" aria-label="会话使用说明" @click="emit('help')"><MoreHorizontal /></button></div><button v-for="session in recent" :key="session.id" :title="session.title" :class="{ active: route.path === '/chat' && chat.activeId === session.id }" @click="openSession(session.id)">{{ session.title }}</button><p v-if="!recent.length">从一个问题开始新的对话</p></section><div class="sidebar-account"><ElDropdown trigger="click" @command="accountAction"><button class="account-button" :aria-label="realKnowledge ? '工作空间菜单' : '演示用户菜单'"><span class="account-avatar">RM</span><span class="sidebar-label account-name"><strong>RoadMind 用户</strong><small>{{ realKnowledge ? '知识库连接 MySQL' : '本地演示空间' }}</small></span><ArrowDown class="sidebar-label" /></button><template #dropdown><ElDropdownMenu><ElDropdownItem command="help">演示说明与字体致谢</ElDropdownItem><ElDropdownItem command="reset">重置本地演示数据</ElDropdownItem></ElDropdownMenu></template></ElDropdown></div></aside>
</template>
