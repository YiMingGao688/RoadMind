<script setup lang="ts">
import { ref } from 'vue'
import { UploadFilled, InfoFilled } from '@/components/icons'
import { ElUpload, ElButton, ElMessage, type UploadFile, type UploadUserFile, type UploadRawFile } from 'element-plus'
import { useWorkspaceStore } from '@/stores/workspace'
const props = defineProps<{ knowledgeId: string }>()
const files = ref<UploadUserFile[]>([])
const workspace = useWorkspaceStore()

/** auto-upload 关闭，选取时仅在浏览器校验类型和大小。 */
function validateFile(file: UploadFile) {
  if (!/\.(pdf|docx?)$/i.test(file.name) || (file.size || 0) > 20 * 1024 * 1024) {
    files.value = files.value.filter(item => item.uid !== file.uid)
    ElMessage.warning('请选择不超过 20 MB 的 PDF、DOC 或 DOCX 文件')
  }
}
function addRecords() {
  const rawFiles = files.value.map(file => file.raw).filter((file): file is UploadRawFile => !!file)
  const count = workspace.addLocalDocuments(props.knowledgeId, rawFiles)
  files.value = []
  if (count) ElMessage.success('已添加 ' + count + ' 条本地待上传记录，文件未上传或解析')
  else ElMessage.info('没有新增记录，请检查重复文件或文件格式')
}
/** 超出数量时在脚本层显示提示，保持模板回调类型明确。 */
function handleExceed() { ElMessage.warning('每次最多选择 5 个文件') }
</script>
<template>
  <section class="panel upload-panel">
    <div class="section-heading"><h3>添加文档</h3><span class="demo-badge">本地演示</span></div>
    <p class="subtle">体验文件选择与文档登记流程</p>
    <ElUpload v-model:file-list="files" drag multiple :auto-upload="false" :limit="5" accept=".pdf,.doc,.docx" :on-change="validateFile" :on-exceed="handleExceed">
      <UploadFilled class="upload-icon" />
      <div class="upload-title">拖拽文件到这里</div><p>或<span class="brand-text">点击选择文件</span></p>
      <small>PDF / Word · 单个文件不超过 20 MB</small>
    </ElUpload>
    <ElButton type="primary" class="full-width" :disabled="!files.length" @click="addRecords">添加演示记录</ElButton>
    <div class="upload-note"><InfoFilled class="icon" /><span>仅登记文件信息，内容不会上传、解析或向量化。新增记录将保持“本地待上传”。</span></div>
  </section>
</template>
