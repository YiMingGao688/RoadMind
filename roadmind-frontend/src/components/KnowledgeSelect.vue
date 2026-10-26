<script setup lang="ts">
import { ElSelect, ElOption } from 'element-plus'
import { useWorkspaceStore } from '@/stores/workspace'
const model = defineModel<string>({ default: 'all' })
defineProps<{ disabled?: boolean }>()
const workspace = useWorkspaceStore()
</script>
<template>
  <ElSelect v-model="model" aria-label="选择知识库" :disabled="disabled" class="knowledge-select">
    <ElOption label="全部知识库" value="all" />
    <ElOption v-for="kb in workspace.knowledgeBases" :key="kb.id" :label="kb.name" :value="kb.id" />
  </ElSelect>
</template>
