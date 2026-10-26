<script setup lang="ts">
import { Document } from './icons'
import type { PreviewDocument } from '@/types/knowledge'
import { kindLabel } from '@/mocks/catalog'
defineProps<{ document: PreviewDocument; selected?: boolean }>()
defineEmits<{ select: [document: PreviewDocument] }>()
</script>
<template><button class="search-result-item" :class="{ selected }" @click="$emit('select', document)"><span class="search-result-file" :class="document.format === 'PDF' ? 'is-pdf' : 'is-word'"><Document /></span><span class="search-result-copy"><strong>{{ document.title }} <span class="demo-badge">演示资料</span></strong><span class="search-result-summary">{{ document.summary }}</span><span class="search-result-metadata"><span class="document-kind">{{ kindLabel(document.kind) }}</span><span>{{ document.knowledgeName }}</span><time>{{ document.updatedAt }}</time></span></span><span class="search-result-page">P.{{ document.sections[0]?.page || 1 }}</span></button></template>
