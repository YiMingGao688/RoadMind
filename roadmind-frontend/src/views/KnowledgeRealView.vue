<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElInput, ElTable, ElTableColumn, ElEmpty, ElPagination, ElSkeleton, ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Grid, List, Upload, ArrowLeft, EditPen, Delete, RefreshLeft, Document } from '@/components/icons'
import KnowledgeCard from '@/components/KnowledgeCard.vue'
import KnowledgeCreateDialog from '@/components/KnowledgeCreateDialog.vue'
import { deleteKnowledgeBase, getKnowledgeBase, listKnowledgeBases } from '@/api/knowledge-bases'
import type { KnowledgeBase } from '@/types/domain'
import type { KnowledgeBaseRecord, KnowledgeCategory } from '@/types/knowledge-api'

const route = useRoute()
const router = useRouter()
const keyword = ref('')
const category = ref<KnowledgeCategory | ''>('')
const page = ref(1)
const size = ref(8)
const total = ref(0)
const records = ref<KnowledgeBaseRecord[]>([])
const detail = ref<KnowledgeBaseRecord | null>(null)
const loading = ref(false)
const error = ref('')
const viewMode = ref<'cards' | 'list'>('cards')
const dialogOpen = ref(false)
const editing = ref<KnowledgeBaseRecord | null>(null)
const editingId = ref('')
const deletingId = ref('')
const detailId = computed(() => typeof route.params.id === 'string' ? route.params.id : '')
// 显示名称沿用现有设计，发送到 API 的是原有业务分类值。
const tabs: { label: string; value: KnowledgeCategory | '' }[] = [
  { label: '全部', value: '' }, { label: '技术规范', value: '日常养护' },
  { label: '工程案例', value: '作业管理' }, { label: '行业指南', value: '设施管理' },
  { label: '内部资料', value: '应急安全' },
]
let controller: AbortController | null = null
let requestVersion = 0
let searchTimer: ReturnType<typeof setTimeout> | undefined

/** 加载真实 API，取消过期请求，失败时显示错误并保留真实模式，绝不回退到 Mock。 */
async function load() {
  controller?.abort()
  const current = new AbortController()
  controller = current
  const version = ++requestVersion
  loading.value = true; error.value = ''
  try {
    if (detailId.value) {
      const response = await getKnowledgeBase(detailId.value, current.signal)
      if (version === requestVersion) detail.value = response
    } else {
      const response = await listKnowledgeBases({ page: page.value, size: size.value, keyword: keyword.value.trim() || undefined, category: category.value || undefined }, current.signal)
      if (version === requestVersion) { records.value = response.records; total.value = response.total }
    }
  } catch (failure) {
    if (current.signal.aborted || version !== requestVersion) return
    records.value = []; detail.value = null; total.value = 0
    error.value = failure instanceof Error ? failure.message : '知识库加载失败，请稍后重试'
  } finally { if (version === requestVersion) loading.value = false }
}

/** API 记录只转换为既有卡片需要的显示字段，不追加到演示 workspace。 */
function card(record: KnowledgeBaseRecord): KnowledgeBase {
  const colors: Record<KnowledgeCategory, KnowledgeBase['color']> = { '日常养护': 'blue', '设施管理': 'teal', '应急安全': 'orange', '作业管理': 'purple' }
  return { id: record.id, name: record.name, description: record.description, category: record.category, color: colors[record.category], updatedAt: formatDate(record.updatedAt) }
}
function formatDate(value: string) { return new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value)) }
function create() { editing.value = null; dialogOpen.value = true }

/** 编辑前读取当前服务端值，避免将陈旧卡片内容作为详情。 */
async function edit(id: string) {
  if (editingId.value || deletingId.value) return
  editingId.value = id
  try { editing.value = await getKnowledgeBase(id); dialogOpen.value = true }
  catch (failure) { ElMessage.error(failure instanceof Error ? failure.message : '读取知识库失败') }
  finally { editingId.value = '' }
}

/** 明确确认后执行 DELETE；成功后重新分页读取，处理删除最后一条后的越界页。 */
async function remove(id: string) {
  if (deletingId.value || editingId.value) return
  const record = detail.value?.id === id ? detail.value : records.value.find(item => item.id === id)
  if (!record) return
  try { await ElMessageBox.confirm('确认删除知识库“' + record.name + '”？删除后将从普通列表中隐藏。', '删除知识库', { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }) }
  catch { return }
  deletingId.value = id
  try {
    await deleteKnowledgeBase(id)
    ElMessage.success('知识库已删除')
    if (detailId.value) await router.push('/knowledge')
    else { if (records.value.length === 1 && page.value > 1) page.value--; await load() }
  } catch (failure) { ElMessage.error(failure instanceof Error ? failure.message : '删除失败'); await load() }
  finally { deletingId.value = '' }
}

async function saved() { if (!detailId.value) page.value = 1; await load() }
function changePage(value: number) { page.value = value; void load() }
function changeSize(value: number) { size.value = value; page.value = 1; void load() }
watch(() => route.params.id, () => { controller?.abort(); detail.value = null; void load() }, { immediate: true })
watch([keyword, category], () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; void load() }, 250)
})
onUnmounted(() => { controller?.abort(); clearTimeout(searchTimer) })
</script>
<template>
  <div class="my-knowledge real-knowledge" :aria-busy="loading">
    <template v-if="!detailId">
      <header class="ai-page-heading">
        <div><h1>我的知识库</h1><p>管理你的行业知识，让资料成为可探索、可引用的知识集合</p></div>
        <div class="ai-page-actions"><ElButton :icon="Upload" @click="ElMessage.info('文档上传将在下一阶段接入，当前仅管理知识库元数据')">上传文档</ElButton><ElButton type="primary" :icon="Plus" @click="create">创建知识库</ElButton></div>
      </header>
      <div class="my-knowledge-toolbar">
        <div class="category-tabs"><button v-for="tab in tabs" :key="tab.value" :class="{ active: category === tab.value }" @click="category = tab.value">{{ tab.label }}</button></div>
        <div class="knowledge-view-tools"><ElInput v-model="keyword" :prefix-icon="Search" placeholder="搜索知识库名称" maxlength="40" clearable aria-label="搜索知识库" /><button :class="{ active: viewMode === 'cards' }" aria-label="卡片视图" @click="viewMode = 'cards'"><Grid /></button><button :class="{ active: viewMode === 'list' }" aria-label="列表视图" @click="viewMode = 'list'"><List /></button></div>
      </div>
    </template>
    <template v-else>
      <button class="back-link" @click="router.push('/knowledge')"><ArrowLeft class="icon" />返回我的知识库</button>
      <header class="ai-page-heading"><div><h1>{{ detail?.name || '知识库详情' }}</h1><p>{{ detail?.description || '知识库资料范围与元数据' }}</p></div><div v-if="detail" class="ai-page-actions"><ElButton :icon="EditPen" :loading="editingId === detail.id" @click="edit(detail.id)">编辑知识库</ElButton><ElButton :icon="Delete" :loading="deletingId === detail.id" @click="remove(detail.id)">删除知识库</ElButton></div></header>
    </template>
    <div v-if="loading" class="knowledge-loading"><ElSkeleton :rows="5" animated /><span>正在读取数据库中的知识库…</span></div>
    <section v-else-if="error" class="knowledge-error" role="alert"><h2>知识库加载失败</h2><p>{{ error }}</p><ElButton :icon="RefreshLeft" @click="load">重新加载</ElButton></section>
    <template v-else-if="!detailId">
      <div v-if="viewMode === 'cards'" class="knowledge-space-grid"><KnowledgeCard v-for="record in records" :key="record.id" :knowledge="card(record)" :count="record.documentCount" mode="real" :busy="deletingId === record.id || editingId === record.id" @edit="edit" @delete="remove" /></div>
      <div v-else class="panel library-list"><ElTable :data="records" @row-click="(row: KnowledgeBaseRecord) => router.push('/knowledge/' + row.id)">
        <ElTableColumn prop="name" label="知识库名称" min-width="190" /><ElTableColumn prop="category" label="主题" width="120" /><ElTableColumn prop="documentCount" label="文档数" width="90" /><ElTableColumn prop="description" label="描述" min-width="220" />
        <ElTableColumn label="操作" width="120"><template #default="{ row }"><button class="text-link" @click.stop="edit(row.id)">编辑</button><button class="text-link knowledge-delete-link" @click.stop="remove(row.id)">删除</button></template></ElTableColumn>
      </ElTable></div>
      <ElEmpty v-if="!records.length" description="暂无知识库，可创建你的第一个知识空间"><ElButton type="primary" :icon="Plus" @click="create">创建知识库</ElButton></ElEmpty>
      <div class="knowledge-pagination"><span>共 {{ total }} 个知识库</span><ElPagination :current-page="page" :page-size="size" :page-sizes="[4, 8, 16, 32]" :total="total" layout="sizes, prev, pager, next" @update:current-page="changePage" @update:page-size="changeSize" /></div>
      <p class="page-demo-boundary">当前为真实 API 模式，知识库保存于 MySQL。文档业务尚未接入，文档数量为 0。</p>
    </template>
    <div v-else-if="detail" class="knowledge-detail-grid">
      <section class="panel document-panel"><div class="section-heading"><h2>文档列表 <span class="count-pill">0</span></h2></div><ElEmpty description="暂无文档，本阶段仅管理知识库元数据" :image-size="88" /><div class="table-footer">0 份文档<span>未添加任何模拟文档</span></div></section>
      <aside class="panel real-knowledge-info"><Document class="icon" /><h2>知识库信息</h2><dl><dt>所属分类</dt><dd>{{ detail.category }}</dd><dt>创建时间</dt><dd>{{ formatDate(detail.createdAt) }}</dd><dt>更新时间</dt><dd>{{ formatDate(detail.updatedAt) }}</dd></dl><p>元数据来自 MySQL。文档上传、解析及知识检索将在后续阶段接入。</p></aside>
    </div>
    <KnowledgeCreateDialog v-model="dialogOpen" mode="real" :knowledge="editing" @saved="saved" />
  </div>
</template>