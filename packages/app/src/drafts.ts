// const qwe = document.styleSheets

import {
  ColorSpace,
  convert,
  LCH,
  OKLCH,
  P3,
  serialize,
  sRGB,
  type Color
} from '@cepheus/color'
import { normalize, type Interpolator, type Unsubscribe } from '@cepheus/core'
import type { Plugin, Iterator } from './engine'

const templateSRGB = (values: string[]) => `:root { ${values.join(' ')} }`
const templateP3 = (values: string[]) =>
  `@supports (color: color(display-p3 1 1 1)) { :root { ${values.join(' ')} } }`

// on a new request it starts with default options
// on return requests it starts with options hydrated from cookies
// when settings change it saves them with http request
// the hydration logic is better left to userland

const REGEX = /^([0-9]+)-([0-9]+)-([0-9]+)-([0-9]+)(-([0-1]|0[0-9]+))?$/i

// const interpolator = createInterpolator(model as ModelUnparsed)

const parseAlpha = (value: string | undefined): number => {
  if (value === undefined) {
    return 1
  }

  if (value.length === 1) {
    return parseInt(value, 10)
  }

  return parseFloat('0.' + value.slice(1))
}

export interface Options {
  p3?: boolean
}

function* colorIterator(
  interpolator: Interpolator,
  p3support: boolean
): Iterator {
  const srgb: string[] = []
  const p3: string[] = []

  let cursor: true | string

  while ((cursor = yield) !== true) {
    const string = cursor.match(REGEX)

    if (string === null) {
      continue
    }

    const color = parseInt(string[1], 10)
    const barycentric = string.slice(2, 5).map((value) => parseInt(value, 10))

    const coords = interpolator.barycentric(
      color,
      ...(normalize(barycentric) as [number, number, number])
    )

    if (coords === undefined) {
      continue
    }

    const colorOKLCH: Color = {
      space: OKLCH,
      coords,
      alpha: parseAlpha(string[6])
    }

    const colorSRGB = convert(colorOKLCH, sRGB, { inGamut: true })
    srgb.push(`---color-${cursor}: ${serialize(colorSRGB)};`)

    if (p3support) {
      const colorP3 = convert(colorOKLCH, P3, { inGamut: true })
      p3.push(`---color-${cursor}: ${serialize(colorP3)};`)
    }
  }

  if (srgb.length === 0) {
    return
  }

  return p3support
    ? templateSRGB(srgb) + ' ' + templateP3(p3)
    : templateSRGB(srgb)
}

export const createPlugin = (
  interpolator: Interpolator,
  options: Options = {}
): Plugin => {
  const p3support = options.p3 ?? window.matchMedia('(color-gamut: p3)').matches

  ColorSpace.register(LCH)
  ColorSpace.register(sRGB)
  ColorSpace.register(OKLCH)

  if (p3support) {
    ColorSpace.register(P3)
  }

  return () => {
    let unsubscribe: Unsubscribe | undefined

    const register = (
      plugins: Map<string, () => Iterator>,
      update: () => void
    ) => {
      unsubscribe = interpolator.subscribe(update)

      plugins.set('color', () => colorIterator(interpolator, p3support))
    }

    const deregister = () => {
      if (unsubscribe !== undefined) {
        unsubscribe()
      }
    }

    return { register, deregister }
  }
}
