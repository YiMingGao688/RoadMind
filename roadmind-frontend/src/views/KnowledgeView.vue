<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElSelect, ElOption } from 'element-plus'
import { useKnowledgeModeStore, type KnowledgeDataMode } from '@/stores/knowledge-mode'
import KnowledgeRealView from './KnowledgeRealView.vue'
import KnowledgeDemoView from './KnowledgeDemoView.vue'
const source = useKnowledgeModeStore()
const router = useRouter()

/** 切换来源时回到对应列表，避免用真实主键查询演示记录或相反。 */
function switchMode(mode: KnowledgeDataMode) {
  source.setMode(mode)
  void router.push('/knowledge')
}
</script>
<template>
  <div class="knowledge-mode-page ai-standard-page">
    <div class="knowledge-mode-bar">
      <span>{{ source.mode === 'real' ? '当前知识库来自 MySQL；文档模块尚未接入' : '独立 Mock 演示；操作不写入数据库' }}</span>
      <ElSelect :model-value="source.mode" aria-label="知识库数据来源" @update:model-value="switchMode">
        <ElOption value="real" label="真实数据（MySQL）" />
        <ElOption value="demo" label="演示数据（Mock）" />
      </ElSelect>
    </div>
    <KnowledgeRealView v-if="source.mode === 'real'" />
    <KnowledgeDemoView v-else />
  </div>
</template>