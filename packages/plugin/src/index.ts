import { ColorSpace, LCH, OKLCH, P3, sRGB } from '@cepheus/color'
import type { Iterator, Plugin } from 'cassiopeia'
import { type Interpolator, type Unsubscribe } from 'cepheus'
import { createIterator } from './create-iterator'

export interface Options {
  p3?: boolean
}

export const createCepheusPlugin = (
  interpolator: Interpolator,
  options: Options = {}
): Plugin => {
  const p3support =
    options.p3 ?? typeof globalThis.matchMedia === 'function'
      ? globalThis.matchMedia('(color-gamut: p3)').matches
      : true

  ColorSpace.register(LCH)
  ColorSpace.register(sRGB)
  ColorSpace.register(OKLCH)

  if (p3support) {
    ColorSpace.register(P3)
  }

  const iteratorColor = createIterator('color')
  const iteratorHue = createIterator('hue')
  const iteratorInvert = createIterator('invert')

  return (iterators: Map<string, () => Iterator>) => {
    let unsubscribe: Unsubscribe | undefined

    const register = (update: () => void) => {
      unsubscribe = interpolator.subscribe(update)

      iterators.set('color', () => iteratorColor(interpolator, p3support))
      iterators.set('hue', () => iteratorHue(interpolator, p3support))
      iterators.set('invert', () => iteratorInvert(interpolator, p3support))
    }

    const deregister = () => {
      if (unsubscribe !== undefined) {
        unsubscribe()
      }
    }

    return { register, deregister }
  }
}
