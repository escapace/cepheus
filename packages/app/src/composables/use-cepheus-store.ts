/* eslint-disable typescript/no-non-null-assertion */

import { createCepheus as _createCepheus, type Cepheus } from '@cepheus/vue'
import { computedAsync, usePreferredColorScheme, usePreferredContrast } from '@vueuse/core'
import { lerp } from 'coastal'
import { throttle } from 'lodash-es'
import { defineStore, type Pinia, storeToRefs } from 'pinia'
import {
  type App,
  computed,
  effectScope,
  inject,
  type InjectionKey,
  onScopeDispose,
  ref,
  unref,
  watch,
} from 'vue'
import type { Preferences } from '../types'

const CONTRAST_MAX = 0.25
const CONTRAST_MIN = 0.1

interface Options {
  pinia: Pinia
  preferences?: Preferences
}

const createCepheusStore = (preferences?: Preferences) =>
  defineStore('cepheus', () => {
    const palette = ref<Preferences['palette']>(preferences?.palette ?? 'one')
    const chroma = ref(preferences?.chroma ?? 1)
    const lightness = ref(preferences?.lightness ?? 0.5)
    const contrast = ref(preferences?.contrast)
    const colorScheme = ref<'dark' | 'light' | undefined>(preferences?.colorScheme)

    return {
      chroma,
      colorScheme,
      contrast,
      lightness,
      palette,
    }
  })

export type CepheusStore = ReturnType<ReturnType<typeof createCepheusStore>>

const createCepheus = async (store: CepheusStore): Promise<[Cepheus, () => void]> => {
  const scope = effectScope(true)

  const paletteInitial = (
    store.palette === 'one'
      ? await import('../palette/palette-one')
      : await import('../palette/palette-two')
  ).default

  const cepheus = scope.run(() => {
    const references = storeToRefs(store)

    const contrastPreferred = usePreferredContrast()
    const contrast = computed<number>(
      () =>
        references.contrast.value ??
        (contrastPreferred.value === 'more' ? 1 : contrastPreferred.value === 'less' ? 0 : 0.5),
    )

    const colorSchemePreferred = usePreferredColorScheme()
    const colorScheme = computed<'dark' | 'light' | undefined>(
      () =>
        references.colorScheme.value ??
        (colorSchemePreferred.value === 'no-preference'
          ? import.meta.env.SSR
            ? undefined
            : 'light'
          : colorSchemePreferred.value),
    )

    const chroma = computed(() => {
      const min = lerp(0.025, 0, unref(contrast))
      const max = unref(references.chroma)

      return { max, min: lerp(0, min, max) }
    })

    const lightness = computed(() => {
      const l = unref(references.lightness)
      const c = lerp(CONTRAST_MAX, CONTRAST_MIN, unref(contrast))

      return { max: lerp(1 - c, 1, l), min: lerp(0, c, l) }
    })

    const palette = computedAsync(
      async () => {
        const value =
          references.palette.value === 'one'
            ? await import('../palette/palette-one')
            : await import('../palette/palette-two')

        return value.default
      },
      paletteInitial,
      { lazy: true },
    )

    const cepheus = _createCepheus({
      chroma,
      colorScheme,
      lightness,
      palette,
    })

    onScopeDispose(() => cepheus.dispose())

    const update = throttle(
      (body: Preferences) => {
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
      watch(
        [
          references.lightness,
          references.chroma,
          references.contrast,
          references.colorScheme,
          references.palette,
        ],
        ([lightness, chroma, contrast, colorScheme, palette]) => {
          update({
            chroma,
            colorScheme,
            contrast,
            lightness,
            palette,
          })
        },
      )

      watch(
        colorScheme,
        (value) => {
          if (value === undefined) {
            document.documentElement.classList.remove('light', 'dark')
          } else {
            document.documentElement.classList.remove(value === 'dark' ? 'light' : 'dark')
            document.documentElement.classList.add(value)
          }
        },
        { immediate: true },
      )
    }

    return cepheus
  })!

  return [cepheus, () => scope.stop()]
}

const INJECTION_KEY_CEPHEUS_STORE: InjectionKey<CepheusStore> = Symbol(
  'INJECTION_KEY_CEPHEUS_STORE',
)

export const createPluginCepheus = async (options: Options) => {
  const { pinia, preferences } = options

  const store = createCepheusStore(preferences)(pinia)
  const [cepheus, disposeCepheus] = await createCepheus(store)

  const dispose = () => {
    store.$dispose()
    disposeCepheus()
  }

  return {
    ...cepheus,
    dispose,
    install: (app: App) => {
      app.provide(INJECTION_KEY_CEPHEUS_STORE, store)
      app.use(cepheus)
      app.onUnmount(dispose)
    },
  }
}

export function useCepheusStore() {
  const store = inject(INJECTION_KEY_CEPHEUS_STORE)

  if (store === undefined) {
    throw Error('no store provided')
  }

  return store
}
