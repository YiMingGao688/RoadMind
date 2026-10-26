<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElForm, ElFormItem, ElSelect, ElOption, ElInput, ElButton, ElDrawer, type FormInstance } from 'element-plus'
import { Search, Tools, CircleCheck, ArrowRight } from '@/components/icons'
import SourceCitation from '@/components/SourceCitation.vue'
import DocumentPreview from '@/components/DocumentPreview.vue'
import { highwayHero } from '@/mocks/covers'
import { adviceTemplates, maintenanceCases } from '@/mocks/fixtures'
import { analyzeMaintenance } from '@/mocks/maintenance'
import { previewReference } from '@/mocks/catalog'
import { useWorkspaceStore } from '@/stores/workspace'
import { useAssistantNavigation } from '@/composables/useAssistantNavigation'
import type { DiseaseCategory, KnowledgeReference } from '@/types/domain'
import type { PreviewDocument } from '@/types/knowledge'
const workspace = useWorkspaceStore()
const assistant = useAssistantNavigation()
const mode = ref('single')
const modes = [{ value: 'single', label: '单病害分析' }, { value: 'combined', label: '综合病害诊断' }, { value: 'cases', label: '案例检索' }, { value: 'plans', label: '处置方案' }]
const categories: Record<DiseaseCategory, string> = { crack: '路面裂缝', pothole: '路面坑槽', drainage: '排水设施异常', other: '其他 / 待研判' }
const form = reactive({ category: 'crack' as DiseaseCategory, roadType: '高速公路', description: '', supplement: '' })
const combined = ref<DiseaseCategory[]>(['crack', 'pothole'])
const formRef = ref<FormInstance>()
const loading = ref(false)
const analysis = ref<Awaited<ReturnType<typeof analyzeMaintenance>> | null>(null)
const caseQuery = ref('')
const cases = computed(() => maintenanceCases.filter(item => (item.title + item.description).includes(caseQuery.value.trim())))
const documentOpen = ref(false)
const preview = ref<PreviewDocument | null>(null)
function loadCase(item: typeof maintenanceCases[number]) { form.category = item.category; form.description = item.description; mode.value = 'single'; formRef.value?.clearValidate() }
async function analyze() {
  if (!await formRef.value?.validate().catch(() => false)) return
  loading.value = true
  try { analysis.value = await analyzeMaintenance({ categories: mode.value === 'combined' ? combined.value.length ? [...combined.value] : [form.category] : [form.category], roadType: form.roadType, description: form.description.trim(), supplement: form.supplement.trim() }) }
  finally { loading.value = false }
}
function openReference(reference: KnowledgeReference) { preview.value = previewReference(reference, workspace.documents, workspace.knowledgeBases); documentOpen.value = true }
function usePlan(category: DiseaseCategory) { form.category = category; form.description = '希望查看' + categories[category] + '的资料整理与复核流程示例。'; mode.value = 'single' }
</script>
<template>
  <div class="maintenance-ai-page ai-standard-page"><header class="maintenance-photo-heading"><div class="maintenance-photo" :style="{ backgroundImage: 'url(' + highwayHero + ')' }" /><div><h1>公路养护助手</h1><p>基于行业知识与工程经验，整理病害信息与参考处置流程</p><span class="demo-badge">模拟分析 · 未进行真实 AI 判断</span></div></header><section class="maintenance-task-card"><nav class="maintenance-mode-tabs"><button v-for="tab in modes" :key="tab.value" :class="{ active: mode === tab.value }" :disabled="loading" @click="mode = tab.value">{{ tab.label }}</button></nav><ElForm v-if="mode === 'single' || mode === 'combined'" ref="formRef" :model="form" label-position="top" :disabled="loading" class="maintenance-task-form" @submit.prevent="analyze"><div class="maintenance-field-row"><ElFormItem label="病害类型"><ElSelect v-if="mode === 'single'" v-model="form.category" aria-label="病害类型"><ElOption v-for="(label, value) in categories" :key="value" :value="value" :label="label" /></ElSelect><ElSelect v-else v-model="combined" multiple aria-label="综合病害类型"><ElOption v-for="(label, value) in categories" :key="value" :value="value" :label="label" /></ElSelect></ElFormItem><ElFormItem label="道路类型"><ElSelect v-model="form.roadType" aria-label="道路类型"><ElOption v-for="road in ['高速公路', '普通国省干线', '农村公路']" :key="road" :value="road" :label="road" /></ElSelect></ElFormItem></div><ElFormItem label="病害描述" prop="description" :rules="[{ required: true, whitespace: true, message: '请描述现场现象，或选择下方示例场景', trigger: 'blur' }]"><ElInput v-model="form.description" type="textarea" :rows="4" resize="none" maxlength="1500" show-word-limit placeholder="请输入所在路段、发现时间、现场现象与已有资料…" aria-label="病害描述" /></ElFormItem><ElFormItem label="补充说明"><ElInput v-model="form.supplement" maxlength="300" placeholder="可选：天气、历史巡查、照片编号等补充信息" aria-label="补充说明" /></ElFormItem><ElButton type="primary" :icon="Search" class="full-width" :loading="loading" native-type="submit">开始分析（演示）</ElButton><p class="maintenance-form-note">当前按所选分类返回预设模板，不进行病害等级判断或真实维修决策。</p></ElForm><div v-else-if="mode === 'cases'" class="maintenance-case-browser"><ElInput v-model="caseQuery" :prefix-icon="Search" placeholder="搜索演示案例" aria-label="搜索案例" clearable /><button v-for="item in cases" :key="item.id" @click="loadCase(item)"><strong>{{ item.title }}</strong><span>{{ item.description }}</span><small>{{ item.location }} · {{ item.date }} · 演示案例</small></button><p v-if="!cases.length" class="small-empty">没有匹配的演示案例</p></div><div v-else class="maintenance-plan-browser"><article v-for="(template, category) in adviceTemplates" :key="category"><Tools class="icon" /><div><h3>{{ template.title }}</h3><p>{{ template.suggestions.join(' ') }}</p></div><button class="text-link" @click="usePlan(category)">带入分析 <ArrowRight class="icon" /></button></article></div></section><div class="maintenance-example-chips"><span>示例场景：</span><button v-for="item in maintenanceCases" :key="item.id" @click="loadCase(item)">{{ item.title }}</button></div><section v-if="analysis" class="maintenance-analysis"><header><div><h2>养护分析与工作建议</h2><p>{{ analysis.request.roadType }} · {{ analysis.request.categories.map(category => categories[category]).join('、') }}</p></div><span class="demo-badge">固定模板 · 需现场复核</span></header><p class="analysis-original">{{ analysis.request.description }}<span v-if="analysis.request.supplement">补充：{{ analysis.request.supplement }}</span></p><div class="analysis-section"><h3>01 可能原因与信息边界</h3><ul><li v-for="item in analysis.causes" :key="item">{{ item }}</li></ul></div><div class="analysis-section"><h3>02 建议检查项</h3><ul class="analysis-checklist"><li v-for="item in analysis.inspections" :key="item"><CircleCheck class="icon" />{{ item }}</li></ul></div><div class="analysis-section"><h3>03 参考处置流程</h3><ol><li v-for="item in analysis.suggestions" :key="item">{{ item }}</li></ol></div><div class="analysis-section"><h3>04 知识依据</h3><div class="analysis-citations"><SourceCitation v-for="(reference, index) in analysis.references" :key="reference.id" :reference="reference" :index="index" @open="openReference" /></div></div></section><ElDrawer v-model="documentOpen" title="知识依据详情" size="560px" class="responsive-drawer"><DocumentPreview :document="preview" expanded @ask="document => assistant.ask('请继续说明《' + document.title + '》的工作记录要点。', document.knowledgeId)" /></ElDrawer></div>
</template>