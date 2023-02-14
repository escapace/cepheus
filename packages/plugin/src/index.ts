import { ColorSpace, LCH, OKLCH, P3, sRGB } from '@cepheus/color'
import type { Iterator, Plugin } from 'cassiopeia'
import { type Interpolator, type Unsubscribe } from 'cepheus'
import { createIterator } from './create-iterator'
import { IteratorOptions, Options } from './types'

export const createCepheusPlugin = (
  interpolator: Interpolator,
  options: Options = {}
): Plugin => {
  const hasMatchMedia = typeof globalThis.matchMedia === 'function'
  const hasCSS = typeof globalThis.CSS === 'object'

  const colorGamut =
    options.colorGamut ??
    (hasMatchMedia
      ? globalThis.matchMedia('(color-gamut: p3)').matches
        ? 'p3'
        : 'srgb'
      : 'srgb')

  const oklch =
    options.colorSpaces?.includes('oklch') ??
    (hasCSS && CSS.supports('(color: oklch(0% 0 0))'))

  const p3 =
    colorGamut === 'p3' &&
    (options.colorSpaces?.includes('p3') ??
      (!oklch && hasCSS && CSS.supports('(color: color(display-p3 0 0 0))')))

  const srgb = options.colorSpaces?.includes('srgb') ?? (!p3 && !oklch)

  const prefersColorScheme = options.prefersColorScheme === true

  const iteratorOptions: IteratorOptions = {
    p3,
    srgb,
    oklch,
    colorGamut,
    prefersColorScheme
  }

  ColorSpace.register(LCH)
  ColorSpace.register(sRGB)
  ColorSpace.register(OKLCH)

  if (p3) {
    ColorSpace.register(P3)
  }

  const iteratorColor = createIterator('color', iteratorOptions)
  const iteratorHue = createIterator('hue', iteratorOptions)
  const iteratorInvert = createIterator('invert', iteratorOptions)

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
