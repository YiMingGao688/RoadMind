<script setup lang="ts">
import { computed } from 'vue'
import { Route, Waves, ShieldCheck, ClipboardList, Collection } from './icons'

const props = defineProps<{
  /** 知识库主题，用于匹配道路、设施、安全与作业的语义图标。 */
  category: string
  /** 延用知识库现有配色标识，不由图标组件修改业务数据。 */
  color: 'blue' | 'teal' | 'orange' | 'purple'
}>()
const icon = computed(() => ({
  日常养护: Route,
  设施管理: Waves,
  应急安全: ShieldCheck,
  作业管理: ClipboardList,
})[props.category] || Collection)
</script>

<template>
  <span class="knowledge-icon" :class="'tone-' + color" aria-hidden="true"><component :is="icon" /></span>
</template>
