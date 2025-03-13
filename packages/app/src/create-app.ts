import { createBrowserSubscription, createCassiopeia } from '@cassiopeia/vue'
import '@unocss/reset/normalize.css'
import { createPinia, type StateTree } from 'pinia'
import 'virtual:uno.css'
import { createSSRApp } from 'vue'
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'
import type { SSRContext } from 'vue/server-renderer'
import App from './components/app.vue'
import Calendar from './components/calendar.vue'
import { createPluginCepheus } from './composables/use-cepheus-store'

declare const INITIAL_STATE: Record<string, StateTree>

export async function createApp(context?: SSRContext) {
  const pinia = createPinia()
  if (!import.meta.env.SSR) pinia.state.value = INITIAL_STATE

  const router = createRouter({
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes: [
      { component: Calendar, path: '/' },
      {
        component: async () => await import('./components/constraint.vue'),
        path: '/constraint',
      },
      {
        component: async () => await import('./components/swatches.vue'),
        path: '/swatches',
      },
      {
        component: async () => await import('./components/fitting.vue'),
        path: '/fitting',
      },
      {
        component: async () => await import('./components/triangle.vue'),
        path: '/triangle',
      },
      {
        component: async () => await import('./components/text.vue'),
        path: '/text',
      },
    ],
  })

  const cepheus = await createPluginCepheus({ pinia, preferences: context?.cepheus?.preferences })

  const cassiopeia = createCassiopeia({
    deferEvery: 8,
    plugins: [cepheus],
  })

  if (!import.meta.env.SSR) {
    // TODO: cleanup
    cassiopeia.subscribe(createBrowserSubscription({ method: 'insert-discard' }))
  }

  const app = createSSRApp(App).use(router).use(pinia).use(cepheus).use(cassiopeia)

  return {
    app,
    cassiopeia,
    cepheus,
    pinia,
    router,
  }
}
