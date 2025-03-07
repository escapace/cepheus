// import { OKLCH, P3, convert, sRGB, serialize, toGamut, type Color } from '@cepheus/color'
import {
  DisplayP3,
  DisplayP3Gamut,
  gamutMapOKLCH,
  OKLCH,
  serialize,
  sRGB,
  sRGBGamut,
} from '@texel/color'
import type { Iterator, StyleSheetPartial } from 'cassiopeia'
import { color as c, ColorGamut, darkMode, INTERPOLATOR, type Interpolator } from 'cepheus'
import { parseAlpha } from './parse-alpha'
import type { Flags, IteratorOptions } from './types'

const COLOR_REGEX = /^([\da-z]+)-(\d{1,3})-(\d{1,3})(-(?:[1-9]?\d|100))?$/i

const template = (
  values: string[],
  flags: Flags,
  colorSchemeStrategy: IteratorOptions['colorSchemeStrategy'],
): StyleSheetPartial | undefined => {
  if (values.length === 0) {
    return undefined
  }

  let selector = ':where(:root,:host,::backdrop,::selection)'
  const media: string[] = []
  const supports: string[] = []

  if (flags.colorScheme !== undefined) {
    if (colorSchemeStrategy === 'media') {
      media.push(`(prefers-color-scheme: ${flags.colorScheme})`)
    } else {
      selector = `${selector}.${flags.colorScheme}`
    }
  }

  if (flags.colorGamut !== 'srgb') {
    media.push(`(color-gamut: ${flags.colorGamut})`)
  }

  if (flags.colorFormat === 'oklch') {
    supports.push('(color: oklch(0% 0 0))')
  }

  if (flags.colorFormat === 'p3') {
    supports.push('(color: color(display-p3 0 0 0))')
  }

  const mediaString = media.length === 0 ? undefined : media.join(' and ')

  const content = [
    mediaString === undefined ? undefined : `@media ${mediaString} {`,
    supports.length === 0 ? undefined : `@supports ${supports.join(' and ')} {`,
    `${selector} { ${values.join(' ')} }`,
    supports.length === 0 ? undefined : `}`,
    mediaString === undefined ? undefined : `}`,
  ]
    .filter((value): value is string => value !== undefined)
    .join(' ')

  return { content, media: mediaString }
}

export const createIterator = (type: 'color' | 'invert', options: IteratorOptions) => {
  function* iteratorColor(interpolator: Interpolator, flags: Flags = options.flags[0]): Iterator {
    const modelColorSpace: Flags['colorGamut'] =
      interpolator[INTERPOLATOR].state.model.colorGamut === ColorGamut.p3 ? 'p3' : 'srgb'

    const isGamutMismatch = flags.colorGamut !== modelColorSpace

    const state: string[] = []

    const mode =
      flags.colorScheme === undefined || (flags.colorScheme === 'dark') === darkMode(interpolator)

    let cursor: string | true

    while ((cursor = yield) !== true) {
      const string = COLOR_REGEX.exec(cursor)

      if (string === null) {
        continue
      }

      const colorN = string[1]
      const [lightness, chroma] = string.slice(2, 4).map((value) => parseInt(value, 10)) as [
        number,
        number,
      ]

      const coords = c(
        interpolator,
        colorN,
        chroma,
        lightness,
        mode ? type === 'invert' : type !== 'invert',
      )

      if (coords === undefined) {
        continue
      }

      const alpha = parseAlpha(string[5])

      const name = `---${type}-${cursor}`
      const value = serialize(
        [
          ...(isGamutMismatch
            ? gamutMapOKLCH(coords, flags.colorGamut === 'p3' ? DisplayP3Gamut : sRGBGamut, OKLCH)
            : coords),
          alpha,
        ],
        OKLCH,
        flags.colorFormat === 'p3' ? DisplayP3 : flags.colorFormat === 'oklch' ? OKLCH : sRGB,
      )

      state.push(`${name}: ${value};`)
    }

    return template(state, flags, options.colorSchemeStrategy)
  }

  return options.flags.length === 1
    ? iteratorColor
    : function* wrapper(interpolator: Interpolator): Iterator {
        const iterators = options.flags.map((value) => {
          const iterator = iteratorColor(interpolator, value)
          // A value passed to the first invocation of next() is always ignored.
          iterator.next()
          return iterator
        })

        let cursor: string | true

        while ((cursor = yield) !== true) {
          for (const iterator of iterators) {
            iterator.next(cursor)
          }
        }

        const accumulator: StyleSheetPartial[] = []

        for (const [index, iterator] of iterators.entries()) {
          const { done, value } = iterator.next(true)

          if (done === true && value !== undefined) {
            accumulator.push({
              ...(value as StyleSheetPartial),
              index,
            })
          }
        }

        return accumulator
      }
}
