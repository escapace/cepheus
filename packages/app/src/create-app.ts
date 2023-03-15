/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { createBrowserSubscription, createCassiopeia } from '@cassiopeia/vue'
import { createCepheus } from '@cepheus/vue'
import '@unocss/reset/normalize.css'
import { chroma, darkMode, lightness, model } from 'cepheus'
import { createPinia, MutationType, type StateTree } from 'pinia'
import 'uno.css'
import { createSSRApp } from 'vue'
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'
import App from './components/app.vue'
import Calendar from './components/calendar.vue'

import { useCepheusStore } from './use-cepheus-store'

declare const INITIAL_STATE: Record<string, StateTree>

export async function createApp() {
  const pinia = createPinia()
  if (!import.meta.env.SSR) pinia.state.value = INITIAL_STATE

  const router = createRouter({
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes: [
      { path: '/', component: Calendar },
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
      },
      {
        path: '/constraint',
        component: async () => await import('./components/constraint.vue')
      }
    ]
  })

  const store = useCepheusStore(pinia)

  const cepheus = createCepheus({
    state: {
      lightness: store.lightness,
      chroma: store.chroma,
      darkMode: store.darkMode,
      model: await store.importModel()
    },
    darkMode: 'media',
    flags: import.meta.env.SSR
      ? {
          colorGamut: ['p3', 'srgb'],
          colorFormat: ['p3', 'srgb', 'oklch'],
          colorScheme: ['dark', 'light']
        }
      : undefined
  })

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

  const updateStore = async (key: string, value: any) => {
    if (key === 'lightness') {
      lightness(cepheus.interpolator, value[0], value[1])
    } else if (key === 'chroma') {
      chroma(cepheus.interpolator, value[0], value[1])
    } else if (key === 'darkMode') {
      darkMode(cepheus.interpolator, value)
    } else if (key === 'model') {
      model(cepheus.interpolator, await store.importModel())
    }
  }

  store.$subscribe((mutation) => {
    if (mutation.type === MutationType.direct) {
      if (
        mutation.events.type === 'set' &&
        mutation.events.newValue !== undefined
      ) {
        void updateStore(mutation.events.key, mutation.events.newValue)
      }
    } else if (mutation.type === MutationType.patchObject) {
      Object.entries<any>(mutation.payload).forEach(
        ([key, value]) => void updateStore(key, value)
      )
    }
  })

  return {
    app,
    cassiopeia,
    pinia,
    router
  }
}
