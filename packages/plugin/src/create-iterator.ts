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
import { StyleSheetPartial } from 'cassiopeia/lib/types/types'
import {
  color as c,
  darkMode,
  normalizeAngle,
  type Interpolator
} from 'cepheus'
import { parseAlpha } from './parse-alpha'
import { Flags, OptionsParsed } from './types'
const HUE_REGEX = /^([0-9]+)-([0-9]+)-([0-9]+)-(-?[0-9]+)(-([0-1]|0[0-9]+))?$/i
const COLOR_REGEX = /^([0-9]+)-([0-9]+)-([0-9]+)(-([0-1]|0[0-9]+))?$/i

const template = (
  values: string[],
  flags: Flags,
  options: Omit<OptionsParsed, 'flags'>
): StyleSheetPartial | undefined => {
  if (values.length === 0) {
    return undefined
  }

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
  options: OptionsParsed
) => {
  const regex = {
    color: COLOR_REGEX,
    invert: COLOR_REGEX,
    hue: HUE_REGEX
  }[type]

  const props = { darkMode: options.darkMode }

  function* iteratorColor(
    interpolator: Interpolator,
    flags: Flags = options.flags[0]
  ): Iterator {
    const state: string[] = []

    const mode =
      flags.colorScheme === 'none' ||
      (flags.colorScheme === 'dark') === darkMode(interpolator)

    let cursor: true | string

    while ((cursor = yield) !== true) {
      const string = cursor.match(regex)

      if (string === null) {
        continue
      }

      const colorN = parseInt(string[1], 10)
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
        space: OKLCH,
        coords,
        alpha
      }

      const name = `---${type}-${cursor}`
      const value =
        flags.colorFormat === 'oklch'
          ? serialize(
              // TODO: only do this when inputGamut is something else
              toGamut(color, {
                space: flags.colorGamut === 'p3' ? P3 : sRGB
              })
            )
          : serialize(
              convert(color, flags.colorFormat === 'p3' ? P3 : sRGB, {
                // TODO: only do this when inputGamut is something else
                inGamut: true
              })
            )

      state.push(`${name}: ${value};`)
    }

    return template(state, flags, props)
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

        let cursor: true | string

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
