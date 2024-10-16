import {
  OKLCH,
  P3,
  convert,
  sRGB,
  serialize,
  toGamut,
  type Color
} from '@cepheus/color'
import type { Iterator, StyleSheetPartial } from 'cassiopeia'
import {
  ColorSpace,
  INTERPOLATOR,
  color as c,
  darkMode,
  normalizeAngle,
  type Interpolator
} from 'cepheus'
import { parseAlpha } from './parse-alpha'
import type { Flags, OptionsAdvanced } from './types'
const HUE_REGEX = /^([\da-z]+)-(\d+)-(\d+)-(-?\d+)(-([01]|0\d+))?$/i
const COLOR_REGEX = /^([\da-z]+)-(\d+)-(\d+)(-([01]|0\d+))?$/i

const template = (
  values: string[],
  flags: Flags,
  options: Omit<OptionsAdvanced, 'flags'>
): StyleSheetPartial | undefined => {
  if (values.length === 0) {
    return undefined
  }

  // TODO: :root, ::backdrop, ::selection { }
  // https://kilianvalkhof.com/2023/css-html/root-isnt-global/
  let selector = ':root'
  const media: string[] = []
  const supports: string[] = []

  if (flags.colorScheme !== 'none') {
    if (options.darkMode === 'media') {
      media.push(`(prefers-color-scheme: ${flags.colorScheme})`)
    } else {
      selector = `:root.${flags.colorScheme}`
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
    mediaString === undefined ? undefined : `}`
  ]
    .filter((value): value is string => value !== undefined)
    .join(' ')

  return { content, media: mediaString }
}

export const createIterator = (
  type: 'color' | 'hue' | 'invert',
  options: OptionsAdvanced
) => {
  const regex = {
    color: COLOR_REGEX,
    hue: HUE_REGEX,
    invert: COLOR_REGEX
  }[type]

  const properties = { darkMode: options.darkMode }

  function* iteratorColor(
    interpolator: Interpolator,
    flags: Flags = options.flags[0]
  ): Iterator {
    const modelColorSpace: Flags['colorGamut'] =
      interpolator[INTERPOLATOR].state.model.colorSpace === ColorSpace.p3
        ? 'p3'
        : 'srgb'

    const isGamutMismatch = flags.colorGamut !== modelColorSpace

    const state: string[] = []

    const mode =
      flags.colorScheme === 'none' ||
      (flags.colorScheme === 'dark') === darkMode(interpolator)

    let cursor: string | true

    while ((cursor = yield) !== true) {
      const string = cursor.match(regex)

      if (string === null) {
        continue
      }

      const colorN = string[1]
      const [chroma, lightness] = string
        .slice(2, 4)
        .map((value) => parseInt(value, 10)) as [number, number]

      const coords = c(
        interpolator,
        colorN,
        chroma,
        lightness,
        mode ? type === 'invert' : type !== 'invert'
      )

      if (coords === undefined) {
        continue
      }

      let alpha: number

      if (type === 'color') {
        alpha = parseAlpha(string[5])
      } else if (type === 'hue') {
        coords[2] = normalizeAngle(coords[2] + parseInt(string[4]))
        alpha = parseAlpha(string[6])
      } else {
        // const chroma = 0.4 - coords[1]
        // coords[1] = chroma
        alpha = parseAlpha(string[5])
      }

      const color: Color = {
        alpha,
        coords,
        space: OKLCH
      }

      const name = `---${type}-${cursor}`
      const value =
        flags.colorFormat === 'oklch'
          ? serialize(
              // if model color space is not the same as the color gamut flag adjust coordinates to fit in gamut
              isGamutMismatch
                ? toGamut(color, {
                    space: flags.colorGamut === 'p3' ? P3 : sRGB
                  })
                : color
            )
          : serialize(
              convert(color, flags.colorFormat === 'p3' ? P3 : sRGB, {
                // if model color space is not the same as the color gamut flag adjust coordinates to fit in gamut
                inGamut: isGamutMismatch
              })
            )

      state.push(`${name}: ${value};`)
    }

    return template(state, flags, properties)
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
              index
            })
          }
        }

        return accumulator
      }
}
