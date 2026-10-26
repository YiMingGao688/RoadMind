<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowRight, Route, Reading, Collection, Tools } from '@/components/icons'
import ChatComposer from '@/components/ChatComposer.vue'
import { suggestedQuestions } from '@/mocks/fixtures'
import { highwayHero } from '@/mocks/covers'
import { useAssistantNavigation } from '@/composables/useAssistantNavigation'
import logo from '@/assets/logo.svg'
const knowledgeId = ref('all')
const assistant = useAssistantNavigation()
const composer = ref<InstanceType<typeof ChatComposer>>()
const suggestions = [
  { title: '路面出现纵向裂缝，巡查要记录什么？', question: suggestedQuestions[0]!, icon: Route },
  { title: '如何整理日常养护的工作依据？', question: suggestedQuestions[2]!, icon: Reading },
  { title: '雨季前的排水设施有哪些检查重点？', question: suggestedQuestions[1]!, icon: Collection },
  { title: '发现路面坑槽后，如何完善记录？', question: suggestedQuestions[3]!, icon: Tools },
]
function ask(question: string) { if (!question.trim()) { composer.value?.focus(); ElMessage.info('请输入养护问题'); return }; void assistant.ask(question, knowledgeId.value) }
</script>
<template>
  <div class="assistant-home"><section class="home-hero"><div class="home-road-visual" :style="{ backgroundImage: 'url(' + highwayHero + ')' }" /><div class="home-hero-content"><div class="home-brand"><img :src="logo" alt="" /><strong>RoadMind</strong><span>智路知枢</span></div><h1>让交通知识，成为你的<span>专业助手</span></h1><p class="home-subtitle">检索行业规范 · 分析道路病害 · 探索可靠的养护方案</p><ChatComposer ref="composer" v-model:knowledge-id="knowledgeId" hero placeholder="请输入你的交通养护问题，例如：路面出现纵向裂缝时应如何记录？" @send="ask" /><p class="home-demo-note">当前为前端演示：回复与引用为预设内容，未调用真实模型。</p></div></section><section class="home-suggestions"><h2><Collection class="icon" />试试这些问题</h2><div class="home-suggestion-grid"><button v-for="item in suggestions" :key="item.title" @click="ask(item.question)"><span class="suggestion-icon"><component :is="item.icon" /></span><span>{{ item.title }}</span><ArrowRight class="icon" /></button></div><div class="home-caption"><span>面向公路交通行业的知识问答空间</span><RouterLink to="/explore">先探索知识资料 <ArrowRight class="icon" /></RouterLink></div></section></div>
</template>