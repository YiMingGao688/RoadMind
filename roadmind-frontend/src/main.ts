import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'element-plus/dist/index.css'
import '@/styles/main.scss'
import '@/styles/ai-layout.scss'
import '@/styles/ai-pages.scss'
import '@/styles/ai-chat.scss'
import '@/styles/knowledge-api.scss'
import App from './App.vue'
import router from './router'

createApp(App).use(createPinia()).use(router).mount('#app')
