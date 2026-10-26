<script setup lang="ts">
defineProps<{ title: string; description: string; eyebrow?: string }>()
</script>
<template>
  <header class="page-heading">
    <div><div v-if="eyebrow" class="eyebrow">{{ eyebrow }}</div><h1>{{ title }}</h1><p>{{ description }}</p></div>
    <div class="page-heading-actions"><slot /></div>
  </header>
</template>
