<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElButton, ElMessage, type FormInstance } from 'element-plus'
import { useWorkspaceStore } from '@/stores/workspace'
import { createKnowledgeBase, updateKnowledgeBase } from '@/api/knowledge-bases'
import type { KnowledgeBaseInput, KnowledgeBaseRecord } from '@/types/knowledge-api'
const open = defineModel<boolean>({ default: false })
const props = withDefaults(defineProps<{ mode?: 'demo' | 'real'; knowledge?: KnowledgeBaseRecord | null }>(), { mode: 'demo', knowledge: null })
const emit = defineEmits<{ created: [id: string]; saved: [id: string] }>()
const form = reactive<KnowledgeBaseInput>({ name: '', description: '', category: '日常养护' })
const formRef = ref<FormInstance>()
const workspace = useWorkspaceStore()
const saving = ref(false)
const editing = computed(() => props.mode === 'real' && !!props.knowledge)

/** 真实模式只在 API 确认后关闭弹窗；演示模式保持原有独立内存记录。 */
async function submit() {
  if (saving.value || !await formRef.value?.validate().catch(() => false)) return
  saving.value = true
  try {
    const input = { name: form.name.trim(), description: form.description.trim(), category: form.category }
    if (props.mode === 'real') {
      const record = props.knowledge ? await updateKnowledgeBase(props.knowledge.id, input) : await createKnowledgeBase(input)
      ElMessage.success(props.knowledge ? '知识库修改已保存' : '知识库已创建并保存到数据库')
      open.value = false
      emit('saved', record.id)
      if (!props.knowledge) emit('created', record.id)
    } else {
      const record = workspace.createKnowledge(input.name, input.description, input.category)
      open.value = false
      ElMessage.success('已加入本地演示知识库，刷新后恢复初始数据')
      emit('created', record.id)
    }
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '保存失败，请稍后重试') }
  finally { saving.value = false }
}
function reset() { form.name = ''; form.description = ''; form.category = '日常养护'; formRef.value?.clearValidate() }
watch(open, value => {
  if (!value) return
  form.name = props.knowledge?.name || ''
  form.description = props.knowledge?.description || ''
  form.category = props.knowledge?.category || '日常养护'
  formRef.value?.clearValidate()
})
</script>
<template>
  <ElDialog v-model="open" :title="editing ? '编辑知识库' : '创建知识库'" width="520px" class="responsive-dialog" :close-on-click-modal="!saving" :close-on-press-escape="!saving" :show-close="!saving" @closed="reset">
    <p class="dialog-intro">{{ editing ? '修改知识库的名称、分类与资料范围。' : '为同一主题的资料建立一个清晰的知识空间。' }}</p>
    <ElForm ref="formRef" :model="form" :disabled="saving" label-position="top" @submit.prevent="submit">
      <ElFormItem label="知识库名称" prop="name" :rules="[{ required: true, whitespace: true, message: '请输入知识库名称', trigger: 'blur' }, { max: 40, message: '名称不能超过 40 个字符', trigger: 'blur' }]">
        <ElInput v-model="form.name" placeholder="例如：路面日常养护资料" maxlength="40" show-word-limit />
      </ElFormItem>
      <ElFormItem label="所属分类"><ElSelect v-model="form.category"><ElOption v-for="category in ['日常养护', '设施管理', '应急安全', '作业管理']" :key="category" :label="category" :value="category" /></ElSelect></ElFormItem>
      <ElFormItem label="知识库描述"><ElInput v-model="form.description" type="textarea" :rows="3" placeholder="简单描述资料范围与使用场景" maxlength="160" show-word-limit /></ElFormItem>
    </ElForm>
    <div class="inline-note">{{ mode === 'real' ? '保存将调用后端 API，成功后写入 MySQL。' : '演示操作：仅添加当前页面会话中的本地卡片。' }}</div>
    <template #footer><ElButton :disabled="saving" @click="open = false">取消</ElButton><ElButton type="primary" :loading="saving" @click="submit">{{ editing ? '保存修改' : mode === 'real' ? '创建知识库' : '创建演示知识库' }}</ElButton></template>
  </ElDialog>
</template>