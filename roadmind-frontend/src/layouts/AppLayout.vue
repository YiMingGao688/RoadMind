<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElDialog, ElInput, ElButton, ElMessage, ElMessageBox } from 'element-plus'
import { Search, Menu, ArrowRight, InfoFilled, RefreshLeft } from '@/components/icons'
import AppSidebar from '@/components/AppSidebar.vue'
import { navigationItems } from '@/router/navigation'
import { useChatStore } from '@/stores/chat'
import { useWorkspaceStore } from '@/stores/workspace'
import { useKnowledgeModeStore } from '@/stores/knowledge-mode'
const route = useRoute()
const router = useRouter()
const chat = useChatStore()
const workspace = useWorkspaceStore()
const knowledgeSource = useKnowledgeModeStore()
const realKnowledge = computed(() => route.path.startsWith('/knowledge') && knowledgeSource.mode === 'real')
const collapsed = ref(false)
const mobileOpen = ref(false)
const searchOpen = ref(false)
const helpOpen = ref(false)
const query = ref('')
const isChat = computed(() => route.path === '/chat')
const searchResults = computed(() => {
  const value = query.value.trim().toLowerCase()
  const pages = navigationItems.filter(item => (item.label + item.description).toLowerCase().includes(value)).map(item => ({ label: item.label, detail: item.description, path: item.path }))
  const documents = value ? workspace.documents.filter(document => document.name.toLowerCase().includes(value)).slice(0, 6).map(document => ({ label: document.name, detail: '演示资料', path: '/explore?doc=' + document.id + '&q=' + encodeURIComponent(document.name.replace(/\.(pdf|docx?)$/i, '')) })) : []
  return [...pages, ...documents]
})
function navigate(path: string) { searchOpen.value = false; query.value = ''; void router.push(path) }
function shortcut(event: KeyboardEvent) { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchOpen.value = true } }
async function reset() {
  try { await ElMessageBox.confirm('将恢复初始样本，清除本次页面会话内新增的演示记录。', '重置演示数据', { confirmButtonText: '重置', cancelButtonText: '取消' }); chat.reset(); workspace.reset(); helpOpen.value = false; await router.push('/dashboard'); ElMessage.success('已恢复演示数据') } catch { /* 取消时保留当前演示。 */ }
}
watch(() => route.fullPath, () => { mobileOpen.value = false })
onMounted(() => window.addEventListener('keydown', shortcut))
onUnmounted(() => window.removeEventListener('keydown', shortcut))
</script>
<template>
  <div class="ai-app" :class="{ 'is-collapsed': collapsed, 'is-chat-route': isChat, 'is-home-route': route.path === '/dashboard' }"><button v-if="mobileOpen" class="ai-mobile-backdrop" aria-label="关闭导航" @click="mobileOpen = false" /><AppSidebar :collapsed="collapsed" :mobile-open="mobileOpen" @collapse="collapsed = !collapsed" @help="helpOpen = true" @reset="reset" /><main class="ai-main app-main"><header v-if="!isChat" class="ai-toolbar"><button class="icon-button ai-mobile-menu" aria-label="打开导航" @click="mobileOpen = true"><Menu /></button><div class="ai-toolbar-actions"><button class="ai-global-search" aria-label="搜索工作空间" @click="searchOpen = true"><Search /><span>搜索知识资料</span><kbd>Ctrl K</kbd></button><span v-if="realKnowledge" class="ai-demo-mode">真实 API 模式</span><button v-else class="ai-demo-mode" @click="helpOpen = true"><InfoFilled />演示模式</button><span class="account-avatar">RM</span></div></header><button v-else class="icon-button ai-mobile-chat-menu" aria-label="打开导航" @click="mobileOpen = true"><Menu /></button><div class="ai-route-content" :class="{ 'ai-route-chat': isChat }"><RouterView /></div></main>
    <ElDialog v-model="searchOpen" title="搜索工作空间" width="600px" class="responsive-dialog"><ElInput v-model="query" :prefix-icon="Search" placeholder="搜索功能或演示资料…" clearable autofocus @keyup.enter="searchResults[0] && navigate(searchResults[0].path)" /><div class="search-results"><button v-for="item in searchResults" :key="item.path" @click="navigate(item.path)"><div><strong>{{ item.label }}</strong><small>{{ item.detail }}</small></div><ArrowRight class="icon" /></button><p v-if="!searchResults.length" class="small-empty">没有找到匹配项</p></div></ElDialog>
    <ElDialog v-model="helpOpen" title="关于 RoadMind 演示空间" width="560px" class="responsive-dialog"><div class="guide-list"><p><strong>AI 问答与引用</strong><span>使用独立 Mock Service 播放预设 Markdown 回复。未接入真实模型，页码和资料片段为演示数据。</span></p><p><strong>知识与文件</strong><span>知识库真实模式从 MySQL 读取和保存元数据；Mock 模式独立演示文件登记与搜索。文件内容尚未上传或解析；预览不是完整原始 PDF。</span></p><p><strong>分析与 RAG</strong><span>养护分析、检索分数和阶段耗时为固定模板与样本，不能作为实际业务结论。</span></p><p><strong>数据保存范围</strong><span>Mock 操作仅保存在当前页面会话；真实知识库元数据保存在 MySQL，刷新后仍保留。</span></p></div><p class="font-attribution">字体致谢：MiSans（小米） · Inter（Rasmus Andersson）</p><template #footer><ElButton :icon="RefreshLeft" @click="reset">重置演示数据</ElButton><ElButton type="primary" @click="helpOpen = false">继续体验</ElButton></template></ElDialog>
  </div>
</template>
