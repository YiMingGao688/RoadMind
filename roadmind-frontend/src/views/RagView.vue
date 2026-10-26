<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElInput, ElButton, ElForm, ElFormItem, ElCheckbox, ElSlider, ElMessage, ElEmpty, ElDrawer, ElDialog } from 'element-plus'
import { Search, ArrowDown, ArrowUp, Document, Timer, InfoFilled, ArrowRight } from '@/components/icons'
import KnowledgeSelect from '@/components/KnowledgeSelect.vue'
import DocumentPreview from '@/components/DocumentPreview.vue'
import { suggestedQuestions } from '@/mocks/fixtures'
import { runMockRetrieval } from '@/mocks/services'
import { previewReference } from '@/mocks/catalog'
import { useWorkspaceStore } from '@/stores/workspace'
import { useAssistantNavigation } from '@/composables/useAssistantNavigation'
import type { RetrievalHit, RetrievalOptions } from '@/types/domain'
import type { PreviewDocument } from '@/types/knowledge'

const workspace = useWorkspaceStore()
const assistant = useAssistantNavigation()
const options = reactive<RetrievalOptions>({ query: suggestedQuestions[0]!, knowledgeId: 'all', strategy: 'hybrid', rrf: true, topK: 5, threshold: 0.3, rerank: true })
const dense = ref(true)
const bm25 = ref(true)
const result = ref(runMockRetrieval(options))
const recall = ref(runMockRetrieval({ ...options, rerank: false }))
const tab = ref<'results' | 'rerank' | 'timings' | 'details'>('results')
const expanded = ref<string[]>([])
const selected = ref<RetrievalHit | null>(result.value.hits[0] || null)
const loading = ref(false)
const hasRun = ref(false)
const helpOpen = ref(false)
const documentOpen = ref(false)
const document = ref<PreviewDocument | null>(null)
const totalTime = computed(() => result.value.timings.reduce((total, stage) => total + stage.milliseconds, 0))
const outputHits = computed(() => tab.value === 'rerank' ? result.value.hits : recall.value.hits)
const strategies = { hybrid: '混合检索', vector: 'Dense 向量检索', keyword: 'BM25 关键词检索' }
const tabs = computed(() => [{ value: 'results' as const, label: '检索结果 (' + recall.value.hits.length + ')' }, { value: 'rerank' as const, label: '重排结果' }, { value: 'timings' as const, label: '阶段耗时' }, { value: 'details' as const, label: '检索详情' }])

/** 使用参数快照筛选固定样本；分数、排名与耗时均不来自向量库或模型。 */
async function run() {
  if (!options.query.trim()) { ElMessage.warning('请输入检索问题'); return }
  if (!dense.value && !bm25.value) { ElMessage.warning('请至少选择一种召回方式'); return }
  loading.value = true
  const snapshot = { ...options, query: options.query.trim(), strategy: dense.value && bm25.value ? 'hybrid' as const : dense.value ? 'vector' as const : 'keyword' as const, rrf: dense.value && bm25.value && options.rrf }
  try {
    await new Promise(resolve => setTimeout(resolve, 320))
    result.value = runMockRetrieval(snapshot)
    recall.value = runMockRetrieval({ ...snapshot, rerank: false })
    selected.value = result.value.hits[0] || null
    expanded.value = []; hasRun.value = true; tab.value = 'results'
  } finally { loading.value = false }
}
function toggle(id: string) { expanded.value = expanded.value.includes(id) ? expanded.value.filter(value => value !== id) : [...expanded.value, id] }
function showDetails(hit: RetrievalHit) { selected.value = hit; tab.value = 'details' }
function showDocument(hit: RetrievalHit) { document.value = previewReference(hit, workspace.documents, workspace.knowledgeBases); documentOpen.value = true }
</script>
<template>
  <div class="rag-laboratory ai-standard-page">
    <header class="ai-page-heading"><div><h1>RAG 实验室</h1><p>调试检索策略与召回结果，观察知识片段的评分与排序</p></div><button class="text-link" @click="helpOpen = true">查看使用说明 <InfoFilled class="icon" /></button></header>
    <div class="rag-lab-label"><span>检索调试</span><span class="demo-badge">Mock 检索 · 未连接向量库</span></div>
    <div class="rag-lab-workspace">
      <section class="rag-lab-settings"><h2>检索配置</h2><ElForm label-position="top" :disabled="loading" @submit.prevent="run"><ElFormItem label="检索问题"><ElInput v-model="options.query" type="textarea" :rows="2" maxlength="500" resize="none" aria-label="检索问题" placeholder="输入需要检索的行业问题…" @keydown.ctrl.enter="run" /></ElFormItem><ElFormItem label="知识库"><KnowledgeSelect v-model="options.knowledgeId" :disabled="loading" /></ElFormItem><ElFormItem label="检索策略"><div class="rag-methods"><ElCheckbox v-model="dense">Dense 向量检索</ElCheckbox><ElCheckbox v-model="bm25">BM25 关键词检索</ElCheckbox><ElCheckbox v-model="options.rrf" :disabled="!dense || !bm25">混合检索（RRF）</ElCheckbox><ElCheckbox v-model="options.rerank">Rerank 重排序</ElCheckbox></div></ElFormItem><ElFormItem label="Top K" class="rag-compact-parameter"><div class="rag-slider-field"><ElSlider v-model="options.topK" :min="1" :max="8" :step="1" aria-label="Top K" /><output>{{ options.topK }}</output></div></ElFormItem><ElFormItem label="相似度阈值" class="rag-compact-parameter"><div class="rag-slider-field"><ElSlider v-model="options.threshold" :min="0" :max="1" :step="0.05" aria-label="相似度阈值" /><output>{{ options.threshold.toFixed(2) }}</output></div></ElFormItem><ElButton type="primary" :icon="Search" class="full-width" :loading="loading" native-type="submit">开始检索（演示）</ElButton></ElForm><p class="rag-config-boundary">仅在手写样本中演示筛选与排序。未执行 Embedding、BM25 或真实重排序计算。</p></section>
      <section class="rag-lab-output"><nav class="rag-output-tabs"><button v-for="item in tabs" :key="item.value" :class="{ active: tab === item.value }" @click="tab = item.value">{{ item.label }}</button></nav><div class="rag-output-summary"><span>{{ hasRun ? '本次演示' : '预设示例' }} · {{ strategies[result.options.strategy] }}</span><span>所有分数与耗时为模拟值</span></div>
        <template v-if="tab === 'results' || tab === 'rerank'"><p class="rag-query-snapshot"><Search class="icon" />{{ result.options.query }}</p><p v-if="tab === 'rerank' && !result.options.rerank" class="rag-disabled-note">本次未启用 Rerank，保持演示相似度顺序。</p><article v-for="(hit, index) in outputHits" :key="hit.id" class="rag-chunk"><div class="rag-chunk-top"><span class="rag-rank">{{ index + 1 }}</span><span class="rag-score">{{ (tab === 'rerank' ? hit.rerankScore ?? hit.similarity : hit.similarity).toFixed(3) }}</span><button class="rag-chunk-title" @click="showDocument(hit)">{{ hit.title }}</button><span class="document-kind">演示片段</span></div><div class="rag-chunk-body"><p :class="{ expanded: expanded.includes(hit.id) }">{{ hit.content }}</p><div class="rag-chunk-meta"><span>示例 P.{{ hit.page }} · {{ hit.chunkId }}</span><span v-if="tab === 'rerank'">相似度 {{ hit.similarity.toFixed(3) }} / 重排 {{ hit.rerankScore?.toFixed(3) || '未启用' }}</span></div><div class="rag-chunk-actions"><button @click="toggle(hit.id)">{{ expanded.includes(hit.id) ? '收起片段' : '展开片段' }}<ArrowUp v-if="expanded.includes(hit.id)" class="icon" /><ArrowDown v-else class="icon" /></button><button @click="showDetails(hit)">检索详情 <ArrowRight class="icon" /></button></div></div></article><ElEmpty v-if="!outputHits.length" description="没有满足当前条件的样本，请调低阈值或更换知识库" :image-size="80" /></template>
        <div v-else-if="tab === 'timings'" class="rag-timing-view"><header><Timer class="icon" /><h3>阶段耗时</h3><span>模拟总耗时 <strong>{{ totalTime }} ms</strong></span></header><div v-for="(stage, index) in result.timings" :key="stage.label" class="rag-timing-row"><span>{{ String(index + 1).padStart(2, '0') }}</span><strong>{{ stage.label }}</strong><div><i :style="{ width: Math.max(3, stage.milliseconds / 150 * 100) + '%' }" /></div><span>{{ stage.milliseconds ? stage.milliseconds + ' ms' : '未启用' }}</span></div><p>预设耗时仅展示检索流程，不能用于实际性能评估。</p></div>
        <div v-else class="rag-detail-view"><h3>本次参数快照</h3><dl><div><dt>知识范围</dt><dd>{{ workspace.knowledgeBases.find(base => base.id === result.options.knowledgeId)?.name || '全部知识库' }}</dd></div><div><dt>召回策略</dt><dd>{{ strategies[result.options.strategy] }}</dd></div><div><dt>RRF / Rerank</dt><dd>{{ result.options.strategy === 'hybrid' && result.options.rrf ? '启用' : '关闭' }} / {{ result.options.rerank ? '启用' : '关闭' }}</dd></div><div><dt>Top K / 阈值</dt><dd>{{ result.options.topK }} / {{ result.options.threshold.toFixed(2) }}</dd></div></dl><template v-if="selected"><h3>选中的候选 Chunk</h3><strong class="rag-detail-title">{{ selected.title }}</strong><div class="rag-detail-metrics"><span>演示相似度 <strong>{{ selected.similarity.toFixed(3) }}</strong></span><span>演示重排分数 <strong>{{ selected.rerankScore?.toFixed(3) || '未启用' }}</strong></span></div><p>{{ selected.content }}</p><p class="rag-detail-source">{{ selected.chunkId }} · 示例第 {{ selected.page }} 页</p><ElButton :icon="Document" @click="showDocument(selected)">查看来源资料</ElButton></template><p v-else>本次没有候选片段，可调整参数后再次演示。</p></div>
      </section>
    </div><p class="page-demo-boundary">当前内容、召回、重排得分及阶段耗时均为前端 Mock，不代表真实检索效果。</p>
    <ElDrawer v-model="documentOpen" title="检索来源详情" size="560px" class="responsive-drawer"><DocumentPreview :document="document" expanded @ask="document => { documentOpen = false; assistant.ask('请结合《' + document.title + '》说明巡查资料复核流程。', document.knowledgeId) }" /></ElDrawer><ElDialog v-model="helpOpen" title="RAG 实验室使用说明" width="560px" class="responsive-dialog"><div class="guide-list"><p><strong>配置与执行</strong><span>输入问题，选择知识库和召回方式，调整 Top K 与阈值后开始演示。至少选择 Dense 或 BM25 中的一种。</span></p><p><strong>结果与快照</strong><span>检索结果按演示相似度排序，重排页使用预设 Rerank 分数。详情和耗时始终对应最近一次执行的参数。</span></p><p><strong>能力边界</strong><span>没有调用 Embedding、Milvus 或重排序模型，不能据此评估算法质量或性能。</span></p></div><template #footer><ElButton type="primary" @click="helpOpen = false">知道了</ElButton></template></ElDialog>
  </div>
</template>