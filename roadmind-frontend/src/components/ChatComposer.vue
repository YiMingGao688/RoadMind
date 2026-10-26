<script setup lang="ts">
import { ref } from 'vue'
import { ElInput, ElButton, ElMessage } from 'element-plus'
import { Promotion, Close, Paperclip, Collection } from './icons'
import KnowledgeSelect from './KnowledgeSelect.vue'
const props = withDefaults(defineProps<{ loading?: boolean; hero?: boolean; placeholder?: string }>(), { placeholder: '继续提问，探索更深入的问题…' })
const emit = defineEmits<{ send: [text: string]; stop: [] }>()
const knowledgeId = defineModel<string>('knowledgeId', { default: 'all' })
const text = ref('')
const input = ref<InstanceType<typeof ElInput>>()
const fileInput = ref<HTMLInputElement>()
const attachment = ref('')
function send() { if (!text.value.trim() || props.loading) { input.value?.focus(); return }; const value = text.value.trim(); text.value = ''; attachment.value = ''; emit('send', value) }
function keydown(event: Event | KeyboardEvent) { if (event instanceof KeyboardEvent && event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); send() } }
function attach(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!/\.(pdf|docx?)$/i.test(file.name) || file.size > 20 * 1024 * 1024) ElMessage.warning('请选择不超过 20 MB 的 PDF 或 Word 文件')
  else { attachment.value = file.name; ElMessage.info('附件仅本地选中，不上传，也不参与演示回复') }
  if (fileInput.value) fileInput.value.value = ''
}
defineExpose({ focus: () => input.value?.focus() })
</script>
<template>
  <div class="ai-composer" :class="{ 'is-hero': hero }">
    <ElInput ref="input" v-model="text" type="textarea" :rows="hero ? 3 : 2" maxlength="2000" resize="none" :placeholder="placeholder" :aria-label="hero ? '首页养护问题' : '输入问答问题'" @keydown="keydown" />
    <div v-if="attachment" class="composer-attachment"><span>{{ attachment }} · 本地演示附件</span><button aria-label="移除附件" @click="attachment = ''"><Close class="icon" /></button></div>
    <div class="ai-composer-toolbar"><div class="composer-scope"><Collection class="icon" /><KnowledgeSelect v-model="knowledgeId" :disabled="loading" /></div><span class="composer-mode">演示模式</span><div class="ai-composer-actions"><input ref="fileInput" type="file" accept=".pdf,.doc,.docx" hidden @change="attach" /><button class="icon-button" aria-label="选择本地参考附件" :disabled="loading" @click="fileInput?.click()"><Paperclip /></button><ElButton v-if="loading" class="composer-stop" aria-label="停止演示" @click="emit('stop')"><Close class="icon" />停止</ElButton><ElButton v-else type="primary" class="composer-send" aria-label="发送问题" :disabled="!text.trim()" @click="send"><Promotion class="icon" /><span v-if="hero">发送</span></ElButton></div></div>
  </div>
</template>
