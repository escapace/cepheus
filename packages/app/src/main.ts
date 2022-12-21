import { useLocalStorage } from '@vueuse/core'
import type { StateTree } from 'pinia'
import { createPinia } from 'pinia'
import { createApp, watch } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import App from './components/app.vue'
// import HomeA from './components/home.vue'
// import HomeB from './components/home2.vue'
// import Canvas from './components/canvas.vue'
// import Triangle from './components/triangle.vue'
// import Constraint from './components/constraint.vue'
import Var from './components/var.vue'
// import Calendar from './components/calendar.vue'

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
    // { path: '/', component: Calendar },
    // { path: '/b', component: HomeA },
    // { path: '/c', component: HomeB },
    // { path: '/d', component: Canvas },
    // { path: '/e', component: Triangle },
    // { path: '/f', component: Constraint },
    { path: '/', component: Var }
  ]
})

createApp(App).use(router).use(pinia).mount('#app')
