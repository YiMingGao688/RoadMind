<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElInput, ElButton, ElDrawer, ElPagination, ElEmpty } from 'element-plus'
import { Search, Filter, ArrowRight } from '@/components/icons'
import SearchResultItem from '@/components/SearchResultItem.vue'
import DocumentPreview from '@/components/DocumentPreview.vue'
import { knowledgeKinds, previewDocument, searchKnowledge } from '@/mocks/catalog'
import type { KnowledgeKind, PreviewDocument } from '@/types/knowledge'
import { useWorkspaceStore } from '@/stores/workspace'
import { useAssistantNavigation } from '@/composables/useAssistantNavigation'
const route = useRoute()
const workspace = useWorkspaceStore()
const assistant = useAssistantNavigation()
const query = ref('')
const category = ref<KnowledgeKind | 'all'>('all')
const results = ref<PreviewDocument[]>([])
const selected = ref<PreviewDocument | null>(null)
const expanded = ref(false)
const loading = ref(false)
const showFilters = ref(false)
const formatFilter = ref('all')
const page = ref(1)
const filtered = computed(() => results.value.filter(document => formatFilter.value === 'all' || document.format === formatFilter.value))
const displayed = computed(() => filtered.value.slice((page.value - 1) * 6, page.value * 6))
const catalog = computed(() => workspace.documents.filter(document => document.status === 'ready').map(document => previewDocument(document, workspace.knowledgeBases)))
let requestId = 0

/** 只接收最后一次筛选的结果，防止快速切换分类时旧结果覆盖新结果。 */
async function search() {
  const id = ++requestId
  loading.value = true
  try {
    const data = await searchKnowledge(query.value, category.value, workspace.documents, workspace.knowledgeBases)
    if (id !== requestId) return
    results.value = data; page.value = 1
    const visible = data.filter(document => formatFilter.value === 'all' || document.format === formatFilter.value)
    const requested = typeof route.query.doc === 'string' ? visible.find(document => document.id === route.query.doc) : null
    selected.value = requested || visible.find(document => document.id === selected.value?.id) || visible[0] || null
  } finally { if (id === requestId) loading.value = false }
}
function selectCategory(value: KnowledgeKind | 'all') { category.value = value; void search() }
function count(value: KnowledgeKind | 'all') { return catalog.value.filter(document => value === 'all' || document.kind === value).length }
function ask(document: PreviewDocument) { void assistant.ask('请结合《' + document.title + '》整理巡查与资料复核要点。', document.knowledgeId) }
watch(() => route.query.q, value => { query.value = typeof value === 'string' ? value : ''; void search() }, { immediate: true })
watch(formatFilter, () => { page.value = 1; if (!filtered.value.some(document => document.id === selected.value?.id)) selected.value = filtered.value[0] || null })
</script>
<template>
  <div class="knowledge-explore ai-standard-page"><header class="ai-page-heading"><div><h1>知识探索</h1><p>在专业知识库中搜索养护规范、案例与技术资料</p></div><span class="demo-badge">演示资料 · 前端关键词筛选</span></header><form class="knowledge-search-form" @submit.prevent="search"><ElInput v-model="query" :prefix-icon="Search" placeholder="搜索知识资料，例如：裂缝、排水、巡查记录" clearable aria-label="搜索知识资料" /><ElButton type="primary" :icon="Search" :loading="loading" native-type="submit">搜索</ElButton></form><div class="knowledge-category-bar"><div class="category-tabs"><button v-for="item in knowledgeKinds" :key="item.value" :class="{ active: category === item.value }" @click="selectCategory(item.value)">{{ item.label }} <span>({{ count(item.value) }})</span></button></div><button class="advanced-filter" @click="showFilters = !showFilters"><Filter class="icon" />高级筛选</button></div><div v-if="showFilters" class="explore-filters"><span>文件格式</span><button v-for="format in ['all', 'PDF', 'DOCX', 'DOC']" :key="format" :class="{ active: formatFilter === format }" @click="formatFilter = format">{{ format === 'all' ? '全部格式' : format }}</button></div><div class="explore-workspace"><section class="explore-result-list" :aria-busy="loading"><div class="explore-results-label"><span>{{ loading ? '正在筛选演示资料…' : '找到 ' + filtered.length + ' 份演示资料' }}</span><span>来源均为手写样本</span></div><SearchResultItem v-for="document in displayed" :key="document.id" :document="document" :selected="selected?.id === document.id" @select="selected = $event" /><ElEmpty v-if="!loading && !displayed.length" description="没有匹配资料，请更换关键词或分类" /><ElPagination v-if="filtered.length > 6" v-model:current-page="page" :page-size="6" :total="filtered.length" layout="prev, pager, next" /></section><aside class="explore-preview"><DocumentPreview :document="selected" @ask="ask" @detail="expanded = true" /></aside></div><ElDrawer v-model="expanded" title="演示资料详情" size="620px" class="responsive-drawer"><DocumentPreview :document="selected" expanded @ask="ask" /></ElDrawer><RouterLink to="/chat" class="explore-bottom-link">没找到合适资料？体验 AI 问答流程 <ArrowRight class="icon" /></RouterLink></div>
</template>
