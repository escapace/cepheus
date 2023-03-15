import { ColorSpace, LCH, OKLCH, P3, sRGB } from '@cepheus/color'
import { Iterators, PLUGIN, Plugin } from 'cassiopeia'
import { subscribe, type Interpolator } from 'cepheus'
import { createIterator } from './create-iterator'
import { permutations } from './permutations'
import { Options, OptionsAdvanced } from './types'

const filterKeys = <T extends string>(record: Record<T, boolean>): T[] => {
  const keys = Object.keys(record) as T[]

  return keys.filter((key) => record[key])
}

const intersection = <T extends string>(a: T[], b: T[] | undefined): T[] => {
  if (b === undefined) {
    return a
  }

  return a.filter((value) => b.includes(value))
}

const createCepheusOptions = (options: Options): OptionsAdvanced => {
  let colorScheme: Array<'dark' | 'light' | 'none'>
  let colorFormat: Array<'srgb' | 'p3' | 'oklch'>
  let colorGamut: Array<'srgb' | 'p3'>

  if (__BROWSER__) {
    colorScheme = options.flags?.colorScheme ?? ['none']

    colorFormat = intersection(
      filterKeys({
        oklch: CSS.supports('(color: oklch(0% 0 0))'),
        p3: CSS.supports('(color: color(display-p3 0 0 0))'),
        srgb: true
      }),
      options.flags?.colorFormat
    )

    colorGamut = intersection(
      globalThis.matchMedia('(color-gamut: p3)').matches
        ? ['p3', 'srgb']
        : ['srgb'],
      options.flags?.colorGamut
    )

    if (colorFormat.includes('oklch')) {
      colorGamut = [colorGamut.includes('p3') ? 'p3' : 'srgb']
      colorFormat = ['oklch']
    } else if (colorGamut.includes('p3') && colorFormat.includes('p3')) {
      colorGamut = ['p3']
      colorFormat = ['p3']
    } else {
      colorGamut = ['srgb']
      colorFormat = ['srgb']
    }
  } else {
    colorScheme = options.flags?.colorScheme ?? ['light', 'dark']
    colorFormat = options.flags?.colorFormat ?? ['srgb']
    colorGamut = options.flags?.colorGamut ?? ['srgb']
  }

  const flags = permutations({
    colorFormat,
    colorGamut,
    colorScheme
  }).filter((flags) => {
    return !(
      (flags.colorFormat === 'p3' && flags.colorGamut === 'srgb') ||
      (flags.colorFormat === 'srgb' && flags.colorGamut === 'p3')
    )
  })

  if (flags.length === 0) {
    throw new Error('[cepheus]: incompatibe options.')
  }

  const darkMode = options.darkMode ?? 'media'

  return {
    darkMode,
    flags
  }
}

const setIterators = (
  interpolator: Interpolator,
  iterators: Iterators,
  options: OptionsAdvanced
) => {
  ColorSpace.register(LCH)
  ColorSpace.register(sRGB)
  ColorSpace.register(OKLCH)
  ColorSpace.register(OKLCH)

  if (options.flags.some((value) => value.colorFormat.includes('p3'))) {
    ColorSpace.register(P3)
  }

  const iteratorColor = createIterator('color', options)
  const iteratorHue = createIterator('hue', options)
  const iteratorInvert = createIterator('invert', options)

  iterators.set('color', () => iteratorColor(interpolator))
  iterators.set('hue', () => iteratorHue(interpolator))
  iterators.set('invert', () => iteratorInvert(interpolator))
}

export const createCepheusPlugin = (
  interpolator: Interpolator,
  options: Options
): Plugin => {
  return {
    [PLUGIN]: (iterators: Iterators, update) => {
      setIterators(interpolator, iterators, createCepheusOptions(options))
      subscribe(interpolator, update)

      if (__BROWSER__) {
        globalThis
          .matchMedia('(color-gamut: p3)')
          .addEventListener('change', () => {
            setIterators(interpolator, iterators, createCepheusOptions(options))
            void update(false)
          })
      }
    }
  }
}

export type { Options }
