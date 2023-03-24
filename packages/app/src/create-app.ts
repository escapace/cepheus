import { createBrowserSubscription, createCassiopeia } from '@cassiopeia/vue'
import '@unocss/reset/normalize.css'
import { createPinia, type StateTree } from 'pinia'
import 'uno.css'
import { createSSRApp } from 'vue'
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'
import App from './components/app.vue'
import Calendar from './components/calendar.vue'
import { useCepheusStore } from './hooks/use-cepheus-store'
import { SSRContext } from 'vue/server-renderer'

declare const INITIAL_STATE: Record<string, StateTree>

export async function createApp(context?: SSRContext) {
  const pinia = createPinia()
  if (!import.meta.env.SSR) pinia.state.value = INITIAL_STATE

  const router = createRouter({
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes: [
      { path: '/', component: Calendar },
      {
        path: '/constraint',
        component: async () => await import('./components/constraint.vue')
      },
      {
        path: '/swatches',
        component: async () => await import('./components/home.vue')
      },
      {
        path: '/fitting',
        component: async () => await import('./components/canvas.vue')
      },
      {
        path: '/triangle',
        component: async () => await import('./components/triangle.vue')
      }
    ]
  })

  const cepheusStore = useCepheusStore(pinia)

  const cepheus = await cepheusStore.createCepheus(context?.cepheus)

  const cassiopeia = createCassiopeia({
    plugins: [cepheus]
  })

  if (!import.meta.env.SSR) {
    cassiopeia.subscribe(createBrowserSubscription())
  }

  const app = createSSRApp(App)
    .use(router)
    .use(pinia)
    .use(cepheus)
    .use(cassiopeia)

  return {
    app,
    cassiopeia,
    cepheusStore,
    pinia,
    router
  }
}
