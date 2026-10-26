<script setup lang="ts">
import { ElButton, ElEmpty } from 'element-plus'
</script>
<template><section class="panel not-found"><ElEmpty description="没有找到这个页面"><RouterLink to="/dashboard"><ElButton type="primary">返回工作台</ElButton></RouterLink></ElEmpty></section></template>
