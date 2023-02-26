import { ColorSpace, LCH, OKLCH, P3, sRGB } from '@cepheus/color'
import type { Iterator, Plugin } from 'cassiopeia'
import { type Interpolator } from 'cepheus'
import { createIterator } from './create-iterator'
import { permutations } from './permutations'
import { Options, OptionsParsed } from './types'

const getColorFormat = (): Array<'srgb' | 'p3' | 'oklch'> => {
  // TODO: replace with __BROWSER__
  const hasCSS = typeof globalThis.CSS === 'object'

  if (!hasCSS) {
    return ['oklch', 'p3', 'srgb']
  }

  const oklch = hasCSS && CSS.supports('(color: oklch(0% 0 0))')

  const p3 =
    !oklch && hasCSS && CSS.supports('(color: color(display-p3 0 0 0))')

  const srgb = true

  const map = { oklch, p3, srgb }

  const colorFormat = (['oklch', 'p3', 'srgb'] as const).filter(
    (key) => map[key]
  )

  return colorFormat
}

const isParsed = (value: Options | OptionsParsed): value is Options =>
  !Array.isArray(value.flags)

const createCepheusOptions = (
  options: Options | OptionsParsed = {}
): OptionsParsed => {
  if (!isParsed(options)) {
    return options
  }

  // TODO: replace with __BROWSER__
  const hasMatchMedia = typeof globalThis.matchMedia === 'function'

  // TODO: subscribe to changes
  const colorScheme: Array<'dark' | 'light' | 'none'> =
    options.flags?.colorScheme ?? (hasMatchMedia ? ['none'] : ['light', 'dark'])

  // TODO: subscribe to changes
  let colorGamut: Array<'srgb' | 'p3'> =
    options.flags?.colorGamut ??
    (hasMatchMedia
      ? globalThis.matchMedia('(color-gamut: p3)').matches
        ? ['p3', 'srgb']
        : ['srgb']
      : ['p3', 'srgb'])

  let colorFormat: Array<'srgb' | 'p3' | 'oklch'> =
    options.flags?.colorFormat ?? getColorFormat()

  if (hasMatchMedia) {
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

  const darkMode = options.darkMode ?? 'media'

  return {
    darkMode,
    flags
  }
}

export type CepheusCassiopeiaPlugin = Plugin & { options: OptionsParsed }

export const createCepheusPlugin = (
  interpolator: Interpolator,
  options: Options | OptionsParsed = {}
): CepheusCassiopeiaPlugin => {
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

  return {
    options: opts,
    plugin: (iterators: Map<string, () => Iterator>, update) => {
      interpolator.subscribe(update)

      iterators.set('color', () => iteratorColor(interpolator))
      iterators.set('hue', () => iteratorHue(interpolator))
      iterators.set('invert', () => iteratorInvert(interpolator))
    }
  }
}

export type { Options, OptionsParsed }
