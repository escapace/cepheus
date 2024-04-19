/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createCepheus as _createCepheus, type Cepheus } from '@cepheus/vue'
import {
  lerp,
  chroma as updateChroma,
  darkMode as updateDarkMode,
  lightness as updateLightness,
  model as updateModel,
  type Model
} from 'cepheus'
import { throttle } from 'lodash-es'
import { defineStore, skipHydrate } from 'pinia'
import type { Preferences } from 'src/types'
import { computed, ref, watch } from 'vue'
import type { SSRContext } from 'vue/server-renderer'

const MAX = 0.25
const MIN = 0.1

const enum ModelState {
  Active = 'active',
  Pending = 'pending'
}

const importModel = async (model: Preferences['model']): Promise<Model> => {
  const value =
    model === 'one'
      ? await import('../models/model-one')
      : await import('../models/model-two')

  return value.model
}

export const useCepheusStore = defineStore('cepheus', () => {
  const chroma = ref(1)
  const darkMode = ref(
    import.meta.env.SSR
      ? false
      : window.matchMedia('prefers-color-scheme: dark').matches
  )
  const lightness = ref(0.5)
  const contrast = ref(
    import.meta.env.SSR
      ? 0.5
      : window.matchMedia('prefers-color-scheme: more').matches
        ? 1
        : window.matchMedia('prefers-color-scheme: less').matches
          ? 0
          : 0.5
  )
  const model = ref<Preferences['model']>('one')
  const modelState = ref<ModelState>(ModelState.Pending)
  let cepheus: Cepheus | undefined

  const createCepheus = async (
    options?: SSRContext['cepheus']
  ): Promise<Cepheus> => {
    if (cepheus === undefined) {
      chroma.value = options?.preferences?.chroma ?? chroma.value
      lightness.value = options?.preferences?.lightness ?? lightness.value
      contrast.value = options?.preferences?.contrast ?? contrast.value
      darkMode.value = options?.preferences?.darkMode ?? darkMode.value
      model.value = options?.preferences?.model ?? model.value

      const cepheusChroma = computed((): [low: number, high: number] => {
        const low = lerp(0.025, 0, contrast.value)

        const high = chroma.value

        return [lerp(0, low, high), high]
      })

      const cepheusLightness = computed((): [low: number, high: number] => {
        const l = lightness.value
        const c = lerp(MAX, MIN, contrast.value) /*  - lerp(0, MIN, l) */

        return [lerp(0, c, l), lerp(1 - c, 1, l)]
      })

      cepheus = _createCepheus({
        darkMode: options?.darkMode,
        flags: options?.flags,
        state: {
          chroma: cepheusChroma.value,
          darkMode: darkMode.value,
          lightness: cepheusLightness.value,
          model: await importModel(model.value)
        }
      })

      modelState.value = ModelState.Active

      watch(model, async (value) => {
        modelState.value = ModelState.Pending

        void updateModel(cepheus!.interpolator, await importModel(value)).then(
          () => (modelState.value = ModelState.Active)
        )
      })

      watch(
        cepheusLightness,
        (value) => void updateLightness(cepheus!.interpolator, ...value)
      )

      watch(
        cepheusChroma,
        (value) => void updateChroma(cepheus!.interpolator, ...value)
      )

      watch(
        darkMode,
        (value) => void updateDarkMode(cepheus!.interpolator, value)
      )

      const update = throttle(
        () => {
          const body: Preferences = {
            chroma: chroma.value,
            contrast: contrast.value,
            darkMode: darkMode.value,
            lightness: lightness.value,
            model: model.value
          }

          void fetch('/preferences', {
            body: JSON.stringify(body),
            credentials: 'same-origin',
            headers: {
              'content-type': 'application/json'
            },
            method: 'post'
          })
        },
        1000,
        { trailing: true }
      )

      if (!import.meta.env.SSR) {
        watch([lightness, chroma, contrast, darkMode, model], update, {
          immediate: true
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
    model,
    modelState: skipHydrate(modelState)
  }
})
