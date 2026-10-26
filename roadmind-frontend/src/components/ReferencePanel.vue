<script setup lang="ts">
import { Document, Link } from '@/components/icons'
import type { KnowledgeReference } from '@/types/domain'
defineProps<{ references: KnowledgeReference[]; selectedId?: string }>()
defineEmits<{ select: [reference: KnowledgeReference] }>()
</script>
<template>
  <section class="reference-panel" aria-label="知识引用面板">
    <div class="section-heading"><h3><Link class="icon" /> 知识引用 <span class="count-pill">{{ references.length }}</span></h3><span class="demo-badge">示例</span></div>
    <p class="subtle reference-intro">查看回答所关联的演示知识片段</p>
    <div v-if="!references.length" class="small-empty"><Document class="empty-icon" /><p>引用将在这里展示</p><span>选择示例问题，体验引用联动</span></div>
    <button v-for="(reference, index) in references" :key="reference.id" class="reference-card" :class="{ selected: selectedId === reference.id }" @click="$emit('select', reference)">
      <div class="reference-title"><span class="reference-number">{{ index + 1 }}</span><strong>{{ reference.title }}</strong></div>
      <p>{{ reference.content }}</p>
      <div class="reference-meta"><Document class="icon" /> 示例第 {{ reference.page }} 页 <span>{{ reference.chunkId }}</span></div>
    </button>
    <p class="reference-disclaimer">资料、页码和片段均为演示样本，非实际规范原文。</p>
  </section>
</template>
