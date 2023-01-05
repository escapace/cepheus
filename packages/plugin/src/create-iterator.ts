import { convert, OKLCH, P3, serialize, sRGB, type Color } from '@cepheus/color'
import type { Iterator } from 'cassiopeia'
import { normalize, normalizeAngle, type Interpolator } from 'cepheus'
import { parseAlpha } from './parse-alpha'
import { templateP3, templateSRGB } from './template'

const HUE_REGEX =
  /^([0-9]+)-([0-9]+)-([0-9]+)-([0-9]+)-(-?[0-9]+)(-([0-1]|0[0-9]+))?$/i
const COLOR_REGEX = /^([0-9]+)-([0-9]+)-([0-9]+)-([0-9]+)(-([0-1]|0[0-9]+))?$/i

export const createIterator = (type: 'color' | 'hue' | 'invert') => {
  const regex = {
    color: COLOR_REGEX,
    invert: COLOR_REGEX,
    hue: HUE_REGEX
  }[type]

  return function* iteratorColor(
    interpolator: Interpolator,
    p3support: boolean
  ): Iterator {
    const srgb: string[] = []
    const p3: string[] = []

    let cursor: true | string

    while ((cursor = yield) !== true) {
      const string = cursor.match(regex)

      if (string === null) {
        continue
      }

      const color = parseInt(string[1], 10)
      const barycentric = normalize(
        string.slice(2, 5).map((value) => parseInt(value, 10))
      ) as [number, number, number]

      if (type === 'invert') {
        barycentric.reverse()
      }

      const coords = interpolator.barycentric(color, ...barycentric)

      if (coords === undefined) {
        continue
      }

      let alpha: number

      if (type === 'color') {
        alpha = parseAlpha(string[6])
      } else if (type === 'hue') {
        coords[2] = normalizeAngle(coords[2] + parseInt(string[5]))
        alpha = parseAlpha(string[7])
      } else {
        coords[1] = 0.4 - coords[1]
        alpha = parseAlpha(string[6])
      }

      const colorOKLCH: Color = {
        space: OKLCH,
        coords,
        alpha
      }

      const colorSRGB = convert(colorOKLCH, sRGB, { inGamut: true })
      srgb.push(`---${type}-${cursor}: ${serialize(colorSRGB)};`)

      if (p3support) {
        const colorP3 = convert(colorOKLCH, P3, { inGamut: true })
        p3.push(`---${type}-${cursor}: ${serialize(colorP3)};`)
      }
    }

    if (srgb.length === 0) {
      return
    }

    return p3support
      ? templateSRGB(srgb) + ' ' + templateP3(p3)
      : templateSRGB(srgb)
  }
}
