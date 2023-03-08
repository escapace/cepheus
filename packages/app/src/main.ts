import { useLocalStorage } from '@vueuse/core'
import type { StateTree } from 'pinia'
import { createPinia } from 'pinia'
import { createApp, defineComponent, h, watch } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import App from './components/app.vue'
import Canvas from './components/canvas.vue'
import HomeA from './components/home.vue'
import HomeB from './components/home2.vue'
import Triangle from './components/triangle.vue'
import Constraint from './components/constraint.vue'
import Calendar from './components/calendar.vue'

import '@unocss/reset/normalize.css'
import 'uno.css'

import { browserSubscription, createCassiopeia } from '@cassiopeia/vue'
import { createCepheus } from '@cepheus/vue'
import model from './models/model.json'

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
    { path: '/', component: defineComponent(() => () => h('div')) },
    { path: '/calendar', component: Calendar },
    { path: '/blocks', component: HomeA },
    { path: '/c', component: HomeB },
    { path: '/d', component: Canvas },
    { path: '/e', component: Triangle },
    { path: '/f', component: Constraint }
  ]
})

const cepheus = createCepheus({
  model,
  darkMode: 'media',
  lightness: [0.1, 1]
  // flags: { colorScheme: ['dark', 'light'] }
})

const cassiopeia = createCassiopeia({
  plugins: [cepheus]
})

cassiopeia.subscribe(browserSubscription)

createApp(App).use(router).use(pinia).use(cepheus).use(cassiopeia).mount('#app')
