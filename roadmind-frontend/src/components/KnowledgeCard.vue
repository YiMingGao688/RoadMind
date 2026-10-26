<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElMessage } from 'element-plus'
import { MoreHorizontal, Document, EditPen, Delete } from './icons'
import { knowledgeCover } from '@/assets/images/covers'
import type { KnowledgeBase } from '@/types/domain'
const props = withDefaults(defineProps<{ knowledge: KnowledgeBase; count: number; mode?: 'demo' | 'real'; busy?: boolean }>(), { mode: 'demo', busy: false })
const emit = defineEmits<{ edit: [id: string]; delete: [id: string] }>()
const router = useRouter()

/** 卡片负责展示与发出操作意图；真实编辑和删除统一由页面执行。 */
async function action(command: string) {
  if (command === 'open') await router.push('/knowledge/' + props.knowledge.id)
  else if (command === 'edit') emit('edit', props.knowledge.id)
  else if (command === 'delete') emit('delete', props.knowledge.id)
  else { try { await navigator.clipboard.writeText(props.knowledge.name); ElMessage.success('已复制知识库名称') } catch { ElMessage.info('浏览器未允许复制') } }
}
</script>
<template>
  <article class="knowledge-space-card" :aria-busy="busy">
    <button class="knowledge-card-main" :disabled="busy" @click="router.push('/knowledge/' + knowledge.id)">
      <img :src="knowledgeCover(knowledge)" alt="" width="136" height="96" />
      <span><strong>{{ knowledge.name }}</strong><span>{{ knowledge.description || '为这个主题添加第一份资料。' }}</span><small>更新于 {{ knowledge.updatedAt }}</small></span>
    </button>
    <footer>
      <span><Document class="icon" />{{ count }} 份文档</span><span class="demo-badge">{{ mode === 'real' ? 'MySQL' : '本地演示' }}</span>
      <ElDropdown trigger="click" :disabled="busy" @command="action">
        <button class="icon-button" :disabled="busy" :aria-label="'知识库操作：' + knowledge.name"><MoreHorizontal /></button>
        <template #dropdown><ElDropdownMenu>
          <ElDropdownItem command="open">打开知识库</ElDropdownItem>
          <ElDropdownItem v-if="mode === 'real'" command="edit" :icon="EditPen">编辑知识库</ElDropdownItem>
          <ElDropdownItem v-if="mode === 'real'" command="delete" :icon="Delete">删除知识库</ElDropdownItem>
          <ElDropdownItem command="copy">复制名称</ElDropdownItem>
        </ElDropdownMenu></template>
      </ElDropdown>
    </footer>
  </article>
</template>