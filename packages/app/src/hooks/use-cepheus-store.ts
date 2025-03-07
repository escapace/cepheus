import { createCepheus as _createCepheus, type Cepheus } from '@cepheus/vue'
import { computedAsync } from '@vueuse/core'
import { lerp } from 'cepheus'
import { throttle } from 'lodash-es'
import { defineStore } from 'pinia'
import type { Preferences } from 'src/types'
import { computed, ref, watch } from 'vue'
import type { SSRContext } from 'vue/server-renderer'

const MAX = 0.25
const MIN = 0.1

export const useCepheusStore = defineStore('cepheus', () => {
  const chroma = ref(1)
  const darkMode = ref(
    import.meta.env.SSR ? false : window.matchMedia('prefers-color-scheme: dark').matches,
  )
  const lightness = ref(0.75)
  const contrast = ref(
    import.meta.env.SSR
      ? 0.75
      : window.matchMedia('prefers-color-scheme: more').matches
        ? 1
        : window.matchMedia('prefers-color-scheme: less').matches
          ? 0.5
          : 0.75,
  )
  const modelName = ref<Preferences['model']>('one')
  let cepheus: Cepheus | undefined

  const createCepheus = async (options?: SSRContext['cepheus']): Promise<Cepheus> => {
    if (cepheus === undefined) {
      chroma.value = options?.preferences?.chroma ?? chroma.value
      lightness.value = options?.preferences?.lightness ?? lightness.value
      contrast.value = options?.preferences?.contrast ?? contrast.value
      darkMode.value = options?.preferences?.darkMode ?? darkMode.value
      modelName.value = options?.preferences?.model ?? modelName.value

      const cepheusChroma = computed(() => {
        const low = lerp(0.025, 0, contrast.value)

        const high = chroma.value

        return { max: high, min: lerp(0, low, high) }
      })

      const cepheusLightness = computed(() => {
        const l = lightness.value
        const c = lerp(MAX, MIN, contrast.value) /*  - lerp(0, MIN, l) */

        return { max: lerp(1 - c, 1, l), min: lerp(0, c, l) }
      })

      const model = computedAsync(
        async () => {
          const value =
            modelName.value === 'one'
              ? await import('../models/model-one')
              : await import('../models/model-two')

          return value.model
        },
        (modelName.value === 'one'
          ? await import('../models/model-one')
          : await import('../models/model-two')
        ).model,
        { lazy: true },
      )

      cepheus = _createCepheus({
        ...options,
        chroma: cepheusChroma,
        darkMode,
        lightness: cepheusLightness,
        model,
      })

      const update = throttle(
        () => {
          const body: Preferences = {
            chroma: chroma.value,
            contrast: contrast.value,
            darkMode: darkMode.value,
            lightness: lightness.value,
            model: modelName.value,
          }

          void fetch('/preferences', {
            body: JSON.stringify(body),
            credentials: 'same-origin',
            headers: {
              'content-type': 'application/json',
            },
            method: 'post',
          })
        },
        1000,
        { trailing: true },
      )

      if (!import.meta.env.SSR) {
        watch([lightness, chroma, contrast, darkMode, modelName], update, {
          immediate: true,
        })

        watch(darkMode, (value) => {
          document.documentElement.classList.remove(value ? 'light' : 'dark')
          document.documentElement.classList.add(value ? 'dark' : 'light')
        })
      }
    }

    return cepheus
  }

  return {
    chroma,
    contrast,
    createCepheus,
    darkMode,
    lightness,
    model: modelName,
  }
})
