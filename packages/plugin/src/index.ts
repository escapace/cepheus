import { ColorSpace, LCH, OKLCH, P3, sRGB } from '@cepheus/color'
import type { Iterator, Plugin } from 'cassiopeia'
import { type Interpolator, type Unsubscribe } from 'cepheus'
import { createIterator } from './create-iterator'
import { permutations } from './permutations'
import { Options, OptionsParsed } from './types'

const getColorFormat = (
  options: Options,
  colorGamut: Array<'srgb' | 'p3'>
): Array<'srgb' | 'p3' | 'oklch'> => {
  const hasCSS = typeof globalThis.CSS === 'object'

  if (!hasCSS) {
    return ['srgb', 'p3']
  }

  const oklch =
    options.flags?.colorFormat?.includes('oklch') ??
    (hasCSS && CSS.supports('(color: oklch(0% 0 0))'))

  const p3 =
    colorGamut.includes('p3') &&
    (options.flags?.colorFormat?.includes('p3') ??
      (!oklch && hasCSS && CSS.supports('(color: color(display-p3 0 0 0))')))

  const srgb =
    colorGamut.includes('srgb') &&
    (options.flags?.colorFormat?.includes('srgb') ?? (!p3 && !oklch))

  const map = { oklch, p3, srgb }

  const key = (['oklch', 'p3', 'srgb'] as const).find((key) => map[key])

  console.assert(key !== undefined)

  return [key as 'srgb' | 'p3' | 'oklch']
}

const isParsed = (value: Options | OptionsParsed): value is Options =>
  Array.isArray(value.flags)

const createCepheusOptions = (
  options: Options | OptionsParsed = {}
): OptionsParsed => {
  if (!isParsed(options)) {
    return options
  }

  const hasMatchMedia = typeof globalThis.matchMedia === 'function'

  const colorGamut: Array<'srgb' | 'p3'> =
    options.flags?.colorGamut ??
    (hasMatchMedia
      ? globalThis.matchMedia('(color-gamut: p3)').matches
        ? ['p3']
        : ['srgb']
      : ['srgb', 'p3'])

  // TODO: subscribe to changes
  const colorScheme: Array<'dark' | 'light' | 'none'> =
    options.flags?.colorScheme ?? (hasMatchMedia ? ['none'] : ['light', 'dark'])

  const colorFormat: Array<'srgb' | 'p3' | 'oklch'> =
    options.flags?.colorFormat ?? getColorFormat(options, colorGamut)

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

  const darkMode = options.darkMode ?? 'class'

  return {
    darkMode,
    flags
  }
}

export const createCepheusPlugin = (
  interpolator: Interpolator,
  options: Options | OptionsParsed = {}
): Plugin => {
  const opts = createCepheusOptions(options)

  ColorSpace.register(LCH)
  ColorSpace.register(sRGB)
  ColorSpace.register(OKLCH)

  if (opts.flags.some((value) => value.colorFormat.includes('p3'))) {
    ColorSpace.register(P3)
  }

  const iteratorColor = createIterator('color', opts)
  const iteratorHue = createIterator('hue', opts)
  const iteratorInvert = createIterator('invert', opts)

  return (iterators: Map<string, () => Iterator>) => {
    let unsubscribe: Unsubscribe | undefined

    const register = (update: () => void) => {
      unsubscribe = interpolator.subscribe(update)

      iterators.set('color', () => iteratorColor(interpolator))
      iterators.set('hue', () => iteratorHue(interpolator))
      iterators.set('invert', () => iteratorInvert(interpolator))
    }

    const deregister = () => {
      if (unsubscribe !== undefined) {
        unsubscribe()
      }
    }

    return { register, deregister }
  }
}
