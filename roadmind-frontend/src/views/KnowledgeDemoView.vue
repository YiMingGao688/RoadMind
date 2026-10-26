<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElInput, ElSelect, ElOption, ElTable, ElTableColumn, ElTag, ElDrawer, ElDialog, ElEmpty } from 'element-plus'
import { Plus, Search, Grid, List, Upload, ArrowLeft } from '@/components/icons'
import KnowledgeCard from '@/components/KnowledgeCard.vue'
import KnowledgeCreateDialog from '@/components/KnowledgeCreateDialog.vue'
import DocumentUpload from '@/components/DocumentUpload.vue'
import DocumentPreview from '@/components/DocumentPreview.vue'
import { knowledgeKind, knowledgeKinds, previewDocument } from '@/mocks/catalog'
import { useWorkspaceStore } from '@/stores/workspace'
import { useAssistantNavigation } from '@/composables/useAssistantNavigation'
import type { DocumentStatus } from '@/types/domain'
import type { KnowledgeKind, PreviewDocument } from '@/types/knowledge'
const route = useRoute()
const router = useRouter()
const workspace = useWorkspaceStore()
const assistant = useAssistantNavigation()
const keyword = ref('')
const category = ref<KnowledgeKind | 'all'>('all')
const viewMode = ref<'cards' | 'list'>('cards')
const createOpen = ref(false)
const uploadOpen = ref(false)
const uploadId = ref('')
const documentKeyword = ref('')
const statusFilter = ref<DocumentStatus | ''>('')
const preview = ref<PreviewDocument | null>(null)
const previewOpen = ref(false)
const currentKnowledge = computed(() => workspace.knowledgeBases.find(base => base.id === route.params.id))
const knowledgeList = computed(() => workspace.knowledgeBases.filter(base => (base.name + base.description).toLowerCase().includes(keyword.value.trim().toLowerCase()) && (category.value === 'all' || knowledgeKind(base.category) === category.value)))
const knowledgeDocuments = computed(() => workspace.documents.filter(document => document.knowledgeId === currentKnowledge.value?.id))
const filteredDocuments = computed(() => knowledgeDocuments.value.filter(document => document.name.toLowerCase().includes(documentKeyword.value.trim().toLowerCase()) && (!statusFilter.value || document.status === statusFilter.value)))
const statusLabels: Record<DocumentStatus, string> = { ready: '已索引 · 示例', processing: '解析中 · 示例', failed: '解析异常 · 示例', local: '本地待上传' }
const statusTypes: Record<DocumentStatus, 'success' | 'warning' | 'danger' | 'info'> = { ready: 'success', processing: 'warning', failed: 'danger', local: 'info' }
function count(id: string) { return workspace.documents.filter(document => document.knowledgeId === id).length }
function categoryCount(value: KnowledgeKind | 'all') { return workspace.knowledgeBases.filter(base => value === 'all' || knowledgeKind(base.category) === value).length }
function showPreview(id: string) { const document = workspace.documents.find(item => item.id === id); if (document) { preview.value = previewDocument(document, workspace.knowledgeBases); previewOpen.value = true } }
function fileSize(bytes: number) { return bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1024 / 1024).toFixed(1) + ' MB' }
function chooseUpload() { uploadId.value = workspace.knowledgeBases[0]?.id || ''; uploadOpen.value = true }
async function goUpload() { if (!uploadId.value) return; uploadOpen.value = false; await router.push('/knowledge/' + uploadId.value); await nextTick(); document.querySelector('.upload-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
function ask(document: PreviewDocument) { previewOpen.value = false; void assistant.ask('请结合《' + document.title + '》整理巡查记录要点。', document.knowledgeId) }
watch(() => route.params.id, () => { documentKeyword.value = ''; statusFilter.value = ''; previewOpen.value = false })
watch(() => route.query.create, value => { if (value === '1') { createOpen.value = true; void router.replace({ path: route.path, query: {} }) } }, { immediate: true })
watch(() => route.query.doc, value => { if (typeof value === 'string') showPreview(value) }, { immediate: true })
</script>
<template>
  <div class="my-knowledge ai-standard-page"><template v-if="!route.params.id"><header class="ai-page-heading"><div><h1>我的知识库</h1><p>管理你的行业知识，让资料成为可探索、可引用的知识集合</p></div><div class="ai-page-actions"><ElButton :icon="Upload" @click="chooseUpload">上传文档</ElButton><ElButton type="primary" :icon="Plus" @click="createOpen = true">创建知识库</ElButton></div></header><div class="my-knowledge-toolbar"><div class="category-tabs"><button v-for="item in knowledgeKinds" :key="item.value" :class="{ active: category === item.value }" @click="category = item.value">{{ item.label }} ({{ categoryCount(item.value) }})</button></div><div class="knowledge-view-tools"><ElInput v-model="keyword" :prefix-icon="Search" placeholder="搜索知识库" clearable aria-label="搜索知识库" /><button :class="{ active: viewMode === 'cards' }" aria-label="卡片视图" @click="viewMode = 'cards'"><Grid /></button><button :class="{ active: viewMode === 'list' }" aria-label="列表视图" @click="viewMode = 'list'"><List /></button></div></div><div v-if="viewMode === 'cards'" class="knowledge-space-grid"><KnowledgeCard v-for="base in knowledgeList" :key="base.id" :knowledge="base" :count="count(base.id)" /></div><div v-else class="panel library-list"><ElTable :data="knowledgeList" @row-click="(row: { id: string }) => router.push('/knowledge/' + row.id)"><ElTableColumn prop="name" label="知识库名称" min-width="190" /><ElTableColumn prop="category" label="主题" width="120" /><ElTableColumn label="文档数" width="90"><template #default="{ row }">{{ count(row.id) }}</template></ElTableColumn><ElTableColumn prop="description" label="描述" min-width="260" /></ElTable></div><ElEmpty v-if="!knowledgeList.length" description="没有匹配的知识库，可创建一个本地演示知识空间" /><p class="page-demo-boundary">全部为演示知识库；新增记录仅保存在当前页面会话中，刷新后恢复样本。</p></template>
    <template v-else-if="currentKnowledge"><button class="back-link" @click="router.push('/knowledge')"><ArrowLeft class="icon" />返回我的知识库</button><header class="ai-page-heading"><div><h1>{{ currentKnowledge.name }}</h1><p>{{ currentKnowledge.description || '本地演示知识空间' }}</p></div><span class="demo-badge">Mock 演示</span></header><div class="knowledge-detail-grid"><section class="panel document-panel"><div class="section-heading"><h2>文档列表 <span class="count-pill">{{ knowledgeDocuments.length }}</span></h2></div><div class="document-filters"><ElInput v-model="documentKeyword" :prefix-icon="Search" placeholder="搜索文档名称" aria-label="搜索文档" clearable /><ElSelect v-model="statusFilter" placeholder="全部状态" aria-label="文档状态" clearable><ElOption v-for="(label, status) in statusLabels" :key="status" :value="status" :label="label" /></ElSelect></div><ElTable :data="filteredDocuments" class="document-table" empty-text="暂无文档，可添加本地演示记录"><ElTableColumn label="文档名称" min-width="245"><template #default="{ row }"><button class="document-name" @click="showPreview(row.id)"><span><strong>{{ row.name }}</strong><small>{{ row.format }} · {{ fileSize(row.size) }}</small></span></button></template></ElTableColumn><ElTableColumn label="状态" width="130"><template #default="{ row }"><ElTag :type="statusTypes[row.status as DocumentStatus]" size="small">{{ statusLabels[row.status as DocumentStatus] }}</ElTag></template></ElTableColumn><ElTableColumn label="片段" width="65"><template #default="{ row }">{{ row.chunks || '—' }}</template></ElTableColumn><ElTableColumn prop="updatedAt" label="更新时间" width="110" /><ElTableColumn label="操作" width="70"><template #default="{ row }"><button class="text-link" @click="showPreview(row.id)">预览</button></template></ElTableColumn></ElTable><div class="table-footer">共 {{ filteredDocuments.length }} 条记录<span>索引状态为示例，新增文件保持本地待上传</span></div></section><DocumentUpload :key="currentKnowledge.id" :knowledge-id="currentKnowledge.id" /></div></template><ElEmpty v-else description="该演示知识库不存在，刷新会恢复初始数据"><ElButton @click="router.push('/knowledge')">返回我的知识库</ElButton></ElEmpty><KnowledgeCreateDialog v-model="createOpen" /><ElDrawer v-model="previewOpen" title="文档预览" size="560px" class="responsive-drawer"><DocumentPreview :document="preview" expanded @ask="ask" /></ElDrawer><ElDialog v-model="uploadOpen" title="选择目标知识库" width="480px" class="responsive-dialog"><p class="dialog-intro">仅体验文件选择与本地登记，不上传文件内容。</p><ElSelect v-model="uploadId" aria-label="上传目标知识库" class="full-width"><ElOption v-for="base in workspace.knowledgeBases" :key="base.id" :label="base.name" :value="base.id" /></ElSelect><template #footer><ElButton @click="uploadOpen = false">取消</ElButton><ElButton type="primary" :disabled="!uploadId" @click="goUpload">前往添加文档</ElButton></template></ElDialog></div>
</template>