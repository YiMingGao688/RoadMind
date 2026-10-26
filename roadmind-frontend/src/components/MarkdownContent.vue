<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
const props = defineProps<{ content: string }>()

// 禁止原始 HTML；保留 Markdown 默认的危险 URL 校验，不加载远程图片。
const parser = new MarkdownIt({ html: false, linkify: false, breaks: true, typographer: false })
const defaultLink = parser.renderer.rules.link_open
parser.renderer.rules.link_open = (tokens, index, options, environment, renderer) => {
  tokens[index]!.attrSet('target', '_blank')
  tokens[index]!.attrSet('rel', 'noopener noreferrer')
  return defaultLink ? defaultLink(tokens, index, options, environment, renderer) : renderer.renderToken(tokens, index, options)
}
parser.renderer.rules.image = (tokens, index) => parser.utils.escapeHtml('[图片已隐藏：' + (tokens[index]?.content || '演示内容') + ']')
const safeHtml = computed(() => parser.render(props.content))
</script>

<template><div class="markdown-content" v-html="safeHtml" /></template>
