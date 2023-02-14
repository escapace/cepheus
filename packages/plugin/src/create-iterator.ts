import {
  convert,
  OKLCH,
  P3,
  serialize,
  sRGB,
  toGamut,
  type Color
} from '@cepheus/color'
import type { Iterator } from 'cassiopeia'
import { normalizeAngle, type Interpolator } from 'cepheus'
import { parseAlpha } from './parse-alpha'
import { IteratorOptions } from './types'

const HUE_REGEX = /^([0-9]+)-([0-9]+)-([0-9]+)-(-?[0-9]+)(-([0-1]|0[0-9]+))?$/i
const COLOR_REGEX = /^([0-9]+)-([0-9]+)-([0-9]+)(-([0-1]|0[0-9]+))?$/i

const templateSRGB = (values: string[], key?: 'light' | 'dark') =>
  values.length === 0
    ? undefined
    : key === undefined
    ? `:root { ${values.join(' ')} }`
    : `@media (prefers-color-scheme: ${key}) { :root { ${values.join(' ')} } }`

const templateP3 = (values: string[], key?: 'light' | 'dark') =>
  values.length === 0
    ? undefined
    : key === undefined
    ? `@supports (color: color(display-p3 1 1 1)) { :root { ${values.join(
        ' '
      )} } }`
    : `@media (prefers-color-scheme: ${key}) { @supports (color: color(display-p3 1 1 1)) { :root { ${values.join(
        ' '
      )} } } }`

const templateOKLCH = (values: string[], key?: 'light' | 'dark') =>
  values.length === 0
    ? undefined
    : key === undefined
    ? `@supports (color: oklch(0% 0 0)) { :root { ${values.join(' ')} } }`
    : `@media (prefers-color-scheme: ${key}) { @supports (color: oklch(0% 0 0)) { :root { ${values.join(
        ' '
      )} } } }`

const getRegex = (type: 'color' | 'hue' | 'invert') =>
  ({
    color: COLOR_REGEX,
    invert: COLOR_REGEX,
    hue: HUE_REGEX
  }[type])

const isEven = (value: number) => value % 2 === 0

interface Acc {
  light: string[]
  dark: string[]
}

const product = (values: Array<string | undefined>) => {
  values.filter((value): value is string => value !== undefined)

  return values.length === 0 ? undefined : values.join(' ')
}

const toColor = (
  string: string[],
  coords: [number, number, number],
  type: 'color' | 'hue' | 'invert'
): Color => {
  let alpha: number

  if (type === 'color') {
    alpha = parseAlpha(string[5])
  } else if (type === 'hue') {
    coords[2] = normalizeAngle(coords[2] + parseInt(string[4]))
    alpha = parseAlpha(string[6])
  } else {
    coords[1] = 0.4 - coords[1]
    alpha = parseAlpha(string[5])
  }

  return {
    space: OKLCH,
    coords,
    alpha
  }
}

export const createIterator = (
  type: 'color' | 'hue' | 'invert',
  options: IteratorOptions
) => {
  const regex = getRegex(type)

  return function* iteratorColor(interpolator: Interpolator): Iterator {
    const srgb: string[] = []
    const p3: string[] = []
    const oklch: string[] = []

    let cursor: true | string

    while ((cursor = yield) !== true) {
      const string = cursor.match(regex)

      if (string === null) {
        continue
      }

      const color = parseInt(string[1], 10)
      const [chroma, lightness] = string
        .slice(2, 4)
        .map((value) => parseInt(value, 10)) as [number, number]

      const coords = interpolator.get(
        color,
        chroma,
        lightness,
        type === 'invert'
      )

      if (coords === undefined) {
        continue
      }

      const colorOKLCH = toColor(string, coords, type)

      if (options.oklch) {
        oklch.push(
          `---${type}-${cursor}: ${serialize(
            toGamut(colorOKLCH, {
              space: options.colorGamut === 'p3' ? P3 : sRGB
            })
          )};`
        )
      }

      if (options.srgb) {
        srgb.push(
          `---${type}-${cursor}: ${serialize(
            convert(colorOKLCH, sRGB, { inGamut: true })
          )};`
        )
      }

      if (options.p3) {
        const colorP3 = convert(colorOKLCH, P3, { inGamut: true })
        p3.push(`---${type}-${cursor}: ${serialize(colorP3)};`)
      }

      if (options.prefersColorScheme) {
        const _coords = interpolator.get(
          color,
          chroma,
          lightness,
          type !== 'invert'
        )

        if (_coords === undefined) {
          continue
        }

        const _colorOKLCH = toColor(string, _coords, type)

        if (options.oklch) {
          oklch.push(
            `---${type}-${cursor}: ${serialize(
              toGamut(_colorOKLCH, {
                space: options.colorGamut === 'p3' ? P3 : sRGB
              })
            )};`
          )
        }

        if (options.srgb) {
          srgb.push(
            `---${type}-${cursor}: ${serialize(
              convert(_colorOKLCH, sRGB, { inGamut: true })
            )};`
          )
        }

        if (options.p3) {
          p3.push(
            `---${type}-${cursor}: ${serialize(
              convert(_colorOKLCH, P3, { inGamut: true })
            )};`
          )
        }
      }
    }

    if (options.prefersColorScheme) {
      const mode = interpolator.darkMode() ? 'dark' : 'light'

      const reducer = (accumulator: Acc, value: string, index: number) => {
        const key = (mode === 'light' ? isEven(index) : !isEven(index))
          ? 'light'
          : 'dark'

        accumulator[key].push(value)

        return accumulator
      }

      const srgbAccumulator = srgb.reduce<Acc>(reducer, { light: [], dark: [] })
      const p3Accumulator = p3.reduce<Acc>(reducer, { light: [], dark: [] })
      const oklchAccumulator = oklch.reduce<Acc>(reducer, {
        light: [],
        dark: []
      })

      return product(
        (['light', 'dark'] as const).flatMap((key) => [
          templateSRGB(srgbAccumulator[key], key),
          templateP3(p3Accumulator[key], key),
          templateOKLCH(oklchAccumulator[key], key)
        ])
      )
    } else {
      return product([templateSRGB(srgb), templateP3(p3), templateOKLCH(oklch)])
    }
  }
}
