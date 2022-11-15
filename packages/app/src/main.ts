import { useLocalStorage } from '@vueuse/core'
import type { StateTree } from 'pinia'
import { createPinia } from 'pinia'
import { createApp, watch } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import App from './components/app.vue'
import HomeA from './components/home.vue'
import HomeB from './components/home2.vue'
import Canvas from './components/canvas.vue'

import '@unocss/reset/antfu.css'
import 'uno.css'

type State = Record<string, StateTree>

const pinia = createPinia()
const piniaStorage = useLocalStorage<State>('state', {})

pinia.state.value = piniaStorage.value

watch(pinia.state, () => {
  piniaStorage.value = pinia.state.value
})

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeA },
    { path: '/b', component: HomeB },
    { path: '/c', component: Canvas }
  ]
})

createApp(App).use(router).use(pinia).mount('#app')
