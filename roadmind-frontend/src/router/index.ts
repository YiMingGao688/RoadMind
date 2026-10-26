import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [{
    path: '/', component: AppLayout,
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', alias: '/assistant', name: 'dashboard', component: () => import('@/views/DashboardView.vue'), meta: { title: 'AI 智能助手' } },
      { path: 'explore', name: 'explore', component: () => import('@/views/ExploreView.vue'), meta: { title: '知识探索' } },
      { path: 'knowledge', name: 'knowledge', component: () => import('@/views/KnowledgeView.vue'), meta: { title: '我的知识库' } },
      { path: 'knowledge/:id', name: 'knowledge-detail', component: () => import('@/views/KnowledgeView.vue'), meta: { title: '知识库文档' } },
      { path: 'chat', name: 'chat', component: () => import('@/views/ChatView.vue'), meta: { title: 'AI 对话' } },
      { path: 'rag', name: 'rag', component: () => import('@/views/RagView.vue'), meta: { title: 'RAG 实验室' } },
      { path: 'maintenance', name: 'maintenance', component: () => import('@/views/MaintenanceView.vue'), meta: { title: '公路养护助手' } },
      { path: ':pathMatch(.*)*', component: () => import('@/views/NotFoundView.vue'), meta: { title: '页面未找到' } },
    ],
  }],
})
router.afterEach(to => { document.title = String(to.meta.title || '工作空间') + ' · RoadMind' })
export default router
