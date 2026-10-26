<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Document, Collection, ArrowRight, InfoFilled } from './icons'
import type { PreviewDocument } from '@/types/knowledge'
import { kindLabel } from '@/mocks/catalog'
const props = defineProps<{ document: PreviewDocument | null; activeSection?: string; expanded?: boolean }>()
defineEmits<{ ask: [document: PreviewDocument]; detail: [document: PreviewDocument] }>()
const selectedId = ref('')
const panel = ref<HTMLElement>()
watch(() => [props.document?.id, props.activeSection], () => { selectedId.value = props.document?.sections.find(section => section.id === props.activeSection)?.id || props.document?.sections[0]?.id || '' }, { immediate: true })
const selected = computed(() => props.document?.sections.find(section => section.id === selectedId.value))

/** 展开详情时定位到选中的演示章节，不把示例页码当成真实 PDF 坐标。 */
async function selectSection(id: string) {
  selectedId.value = id
  if (!props.expanded) return
  await nextTick()
  const target = [...(panel.value?.querySelectorAll<HTMLElement>('[data-section-id]') || [])].find(element => element.dataset.sectionId === id)
  target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}
</script>
<template>
  <section ref="panel" class="document-preview-panel" aria-label="文档预览">
    <template v-if="document">
      <div class="document-preview-content">
        <div class="document-preview-cover" data-pdf-viewer-placeholder>
          <Document /><span>演示文档</span><small>非原始 PDF</small>
        </div>
        <h3>{{ document.title }}</h3>
        <div class="preview-meta"><span class="document-kind">{{ kindLabel(document.kind) }}</span><time>{{ document.updatedAt }}</time></div>
        <p class="preview-source">{{ document.source }}</p>
        <div class="preview-notice"><InfoFilled class="icon" />{{ document.localOnly ? '文件仅在本地登记，尚未上传或解析。' : '未载入原始文件，仅展示手写演示片段。' }}</div>
        <template v-if="!document.localOnly">
          <h4 class="toc-title"><Collection class="icon" />章节目录</h4>
          <nav class="document-toc">
            <button v-for="section in document.sections" :key="section.id" :class="{ active: section.id === selectedId }" @click="selectSection(section.id)">
              <Document class="icon" /><span>{{ section.title }}</span><small>P.{{ section.page }}</small>
            </button>
          </nav>
          <div v-if="expanded" class="preview-expanded-sections">
            <section v-for="section in document.sections" :key="section.id" :data-section-id="section.id" :class="{ selected: section.id === selectedId }">
              <h4>{{ section.title }} · 示例 P.{{ section.page }}</h4><p>{{ section.content }}</p>
            </section>
          </div>
          <section v-else-if="selected" class="preview-excerpt">
            <span>示例第 {{ selected.page }} 页</span><h4>{{ selected.title }}</h4><p>{{ selected.content }}</p>
          </section>
        </template>
      </div>
      <div class="document-preview-actions">
        <button v-if="!expanded" class="preview-detail-button" @click="$emit('detail', document)">查看资料详情 <ArrowRight class="icon" /></button>
        <button class="preview-ask-button" :disabled="document.localOnly" @click="$emit('ask', document)">围绕这份资料提问 <ArrowRight class="icon" /></button>
      </div>
    </template>
    <div v-else class="ai-empty-state"><Document /><h3>选择一份知识资料</h3><p>资料信息、目录和相关片段将在这里展示。</p></div>
  </section>
</template>