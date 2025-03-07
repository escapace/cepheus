/* eslint-disable typescript/no-non-null-assertion */
import { createCepheusOptions, createIterator } from '@cepheus/plugin'
import { PLUGIN, type Plugin as CassiopeiaPlugin, type Iterators } from 'cassiopeia'
import {
  createInterpolator,
  subscribe,
  chroma as updateChroma,
  darkMode as updateDarkMode,
  lightness as updateLightness,
  model as updateModel,
  type Model,
} from 'cepheus'
import type { MaybeRef } from 'vue'
import { computed, ref, unref, watch, type App, type Plugin as VuePlugin } from 'vue'

import { INJECTION_KEY } from './constants'

export interface Options {
  colorFormat?: MaybeRef<Array<'oklch' | 'p3' | 'srgb'> | undefined>
  colorGamut?: MaybeRef<Array<'p3' | 'srgb'> | undefined>
  colorScheme?: MaybeRef<Array<'dark' | 'light' | undefined> | undefined>
  colorSchemeStrategy?: MaybeRef<'class' | 'media' | undefined>

  chroma?: MaybeRef<{ max: number; min: number }>
  darkMode?: MaybeRef<boolean>
  lightness?: MaybeRef<{ max: number; min: number }>

  model: MaybeRef<Model>
}

export type Cepheus = CassiopeiaPlugin & VuePlugin

const WATCH_OPTIONS = { flush: 'sync' } as const

export const createCepheus = (options: Options): Cepheus => {
  const model = computed(() => unref(options.model))
  const chroma = computed(() => unref(options.chroma))
  const lightness = computed(() => unref(options.lightness))
  const darkMode = computed(() => unref(options.darkMode))

  const interpolator = createInterpolator({
    chroma: unref(chroma),
    darkMode: unref(darkMode),
    lightness: unref(lightness),
    model: unref(model),
  })

  watch(model, (value) => void updateModel(interpolator, value), WATCH_OPTIONS)
  watch(darkMode, (value) => void updateDarkMode(interpolator, value!), WATCH_OPTIONS)
  watch(chroma, (value) => void updateChroma(interpolator, value?.min, value?.max), WATCH_OPTIONS)
  watch(
    lightness,
    (value) => void updateLightness(interpolator, value?.min, value?.max),
    WATCH_OPTIONS,
  )

  const displayP3Support = ref<boolean | undefined>(
    __PLATFORM__ === 'browser' ? globalThis.matchMedia('(color-gamut: p3)').matches : undefined,
  )

  const computedOptions = computed(() => ({
    colorSchemeStrategy: unref(options.colorSchemeStrategy),
    displayP3Support: displayP3Support.value,
    flags: {
      colorFormat: unref(options.colorFormat),
      colorGamut: unref(options.colorGamut),
      colorScheme: unref(options.colorScheme),
    },
  }))

  const computedIteratorOptions = computed(() => createCepheusOptions(computedOptions.value))

  if (__PLATFORM__ === 'browser') {
    globalThis.matchMedia('(color-gamut: p3)').addEventListener(
      'change',
      (event) => {
        displayP3Support.value = event.matches
      },
      { passive: true },
    )
  }

  return {
    install: (app: App) => {
      app.provide(INJECTION_KEY, interpolator)
    },
    [PLUGIN]: (iterators: Iterators, update) => {
      const iteratorOptions = { ...unref(computedIteratorOptions) }

      watch(
        computedIteratorOptions,
        (value) => {
          Object.assign(iteratorOptions, value)

          void update(false)
        },
        WATCH_OPTIONS,
      )

      const iteratorColor = createIterator('color', iteratorOptions)
      const iteratorInvert = createIterator('invert', iteratorOptions)

      iterators.set('color', () => iteratorColor(interpolator))
      iterators.set('invert', () => iteratorInvert(interpolator))

      subscribe(interpolator, update)
    },
  }
}
