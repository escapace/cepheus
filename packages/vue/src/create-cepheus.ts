import {
  createIterator,
  createIteratorMultiplexer,
  createIteratorOptions,
  type ColorFunction,
} from '@cepheus/plugin'
import {
  PLUGIN,
  type Plugin as CassiopeiaPlugin,
  type Iterators,
  type UpdatePlugin,
} from 'cassiopeia'
import {
  createInterpolator,
  subscribe,
  chroma as updateChroma,
  lightness as updateLightness,
  palette as updatePalette,
  type Interpolator,
  type Palette,
} from 'cepheus'
import type { MaybeRef, ObjectPlugin } from 'vue'
import { computed, effectScope, isProxy, onScopeDispose, ref, unref, watch, type App } from 'vue'
import { CEPHEUS_INJECTION_KEY } from './constants'

export interface Options {
  colorFormat?: MaybeRef<Array<'oklch' | 'p3' | 'srgb'> | undefined>
  colorGamut?: MaybeRef<Array<'p3' | 'srgb'> | undefined>
  colorScheme?: MaybeRef<'dark' | 'light' | undefined> | undefined
  colorSchemeStrategy?: MaybeRef<'class' | 'media' | undefined>

  chroma?: MaybeRef<{ max: number; min: number }>
  lightness?: MaybeRef<{ max: number; min: number }>

  colors?: Record<string, ColorFunction | [number, number, number] | undefined>

  palette: MaybeRef<Palette>
}

export interface Cepheus extends CassiopeiaPlugin, ObjectPlugin {
  dispose: () => void
  interpolator: Interpolator
  colors?: Options['colors']
}

const WATCH_OPTIONS = { flush: 'sync' } as const

export const createCepheus = (options: Options): Cepheus => {
  const scope = effectScope(true)

  const colors = options.colors
  const displayP3Support = ref<boolean | undefined>(
    __PLATFORM__ === 'browser' ? globalThis.matchMedia('(color-gamut: p3)').matches : undefined,
  )

  const interpolator = createInterpolator({
    chroma: unref(options.chroma),
    lightness: unref(options.lightness),
    palette: unref(options.palette),
  })

  scope.run(() => {
    if (__PLATFORM__ === 'browser') {
      const listener = (event: MediaQueryListEvent) => {
        displayP3Support.value = event.matches
      }
      const mediaQueryList = globalThis.matchMedia('(color-gamut: p3)')

      mediaQueryList.addEventListener('change', listener, { passive: true })

      onScopeDispose(() => {
        mediaQueryList.removeEventListener('change', listener)
      })
    }

    const palette = computed(() => unref(options.palette))
    const chroma = computed(() => unref(options.chroma))
    const lightness = computed(() => unref(options.lightness))

    watch(palette, (value) => void updatePalette(interpolator, value), WATCH_OPTIONS)
    watch(chroma, (value) => void updateChroma(interpolator, value?.min, value?.max), WATCH_OPTIONS)
    watch(
      lightness,
      (value) => void updateLightness(interpolator, value?.min, value?.max),
      WATCH_OPTIONS,
    )
  })

  const dispose = () => scope.stop()

  const plugin = (iterators: Iterators, update: UpdatePlugin) => {
    scope.run(() => {
      const iteratorOptions = computed(() =>
        createIteratorOptions({
          colorFormat: unref(options.colorFormat),
          colorGamut: unref(options.colorGamut),
          colorScheme: unref(options.colorScheme),
          colorSchemeStrategy: unref(options.colorSchemeStrategy),
          displayP3Support: displayP3Support.value,
        }),
      )

      watch(
        iteratorOptions,
        ({ colorSchemeStrategy, combinations }) => {
          const options = combinations.map((combination) => ({
            ...combination,
            colors,
            colorSchemeStrategy,
            interpolator,
          }))

          const thunk =
            options.length === 1
              ? () => createIterator(options[0])
              : createIteratorMultiplexer(createIterator, options)

          iterators.set('color', thunk)

          void update(false)
        },
        { ...WATCH_OPTIONS, immediate: true },
      )

      if (colors !== undefined && isProxy(colors)) {
        watch(colors, () => void update(false), WATCH_OPTIONS)
      }

      const unsubscribe = subscribe(interpolator, update)

      onScopeDispose(() => {
        unsubscribe()
        setImmediate(() => {
          iterators.delete('color')
        })
      })
    })
  }

  const cepheus: Cepheus = {
    colors,
    dispose,
    install: (app: App) => {
      app.provide(CEPHEUS_INJECTION_KEY, cepheus)

      app.onUnmount(dispose)
    },
    interpolator,
    [PLUGIN]: plugin,
  }

  return cepheus
}
