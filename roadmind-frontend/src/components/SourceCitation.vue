<script setup lang="ts">
import { Document, ArrowRight } from './icons'
import type { KnowledgeReference } from '@/types/domain'
defineProps<{ reference: KnowledgeReference; index: number; active?: boolean }>()
defineEmits<{ open: [reference: KnowledgeReference] }>()
</script>
<template><button class="source-citation" :class="{ active }" @click="$emit('open', reference)"><span class="citation-file"><Document /></span><span class="citation-text"><strong>{{ reference.title }}</strong><small>演示片段 · 示例第 {{ reference.page }} 页</small><span>{{ reference.content }}</span></span><ArrowRight class="citation-arrow" /><span class="citation-index">{{ index + 1 }}</span></button></template>
