<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument, RefreshLeft, CircleCheck, ThumbsUp, ThumbsDown, Warning } from './icons'
import MarkdownContent from './MarkdownContent.vue'
import type { ChatMessage, KnowledgeReference } from '@/types/domain'
import logo from '@/assets/logo.svg'
const props = defineProps<{ message: ChatMessage; busy?: boolean }>()
const emit = defineEmits<{ citation: [reference: KnowledgeReference]; retry: [id: string] }>()
const feedback = ref<'up' | 'down' | null>(null)
const copied = ref(false)
async function copy() {
  try { await navigator.clipboard.writeText(props.message.content); copied.value = true; setTimeout(() => copied.value = false, 1600) }
  catch { ElMessage.info('浏览器未允许复制，可手动选择文本') }
}
</script>
<template>
  <article class="ai-message" :class="message.role">
    <template v-if="message.role === 'user'"><div class="user-message-text">{{ message.content }}</div><span class="ai-user-avatar">我</span></template>
    <template v-else><img class="ai-message-logo" :src="logo" alt="RoadMind" /><div class="ai-message-body"><div class="ai-message-author">RoadMind <span class="demo-badge">演示回复</span></div><div v-if="message.status === 'error'" class="message-error"><Warning class="icon" /><span>{{ message.content }}</span><button :disabled="busy" @click="emit('retry', message.id)">重试</button></div><template v-else><div v-if="!message.content" class="message-loading"><i /><i /><i /><span>准备演示回复…</span></div><MarkdownContent v-else :content="message.content" /><div class="inline-citations"><button v-for="(reference, index) in message.references" :key="reference.id" @click="emit('citation', reference)">[{{ index + 1 }}] {{ reference.title }}</button></div></template><div v-if="message.content && message.status !== 'streaming'" class="ai-message-actions"><span v-if="message.status === 'stopped'">演示播放已停止</span><span v-else>预设模板 · 未调用真实模型</span><button v-if="message.status !== 'error'" :disabled="busy" @click="emit('retry', message.id)"><RefreshLeft class="icon" />重新演示</button><button aria-label="复制回答" @click="copy"><CircleCheck v-if="copied" class="icon" /><CopyDocument v-else class="icon" /></button><button aria-label="赞同演示回答" :class="{ selected: feedback === 'up' }" @click="feedback = feedback === 'up' ? null : 'up'"><ThumbsUp class="icon" /></button><button aria-label="反馈演示回答" :class="{ selected: feedback === 'down' }" @click="feedback = feedback === 'down' ? null : 'down'"><ThumbsDown class="icon" /></button></div></div></template>
  </article>
</template>
