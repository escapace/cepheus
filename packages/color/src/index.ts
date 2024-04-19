import './colorjs-io.d'

export {
  A98RGB,
  A98RGB_Linear,
  clone,
  ColorSpace,
  contrastAPCA,
  contrastDeltaPhi,
  contrastLstar,
  contrastMichelson,
  contrastWCAG21,
  contrastWeber,
  deltaE2000,
  deltaE76,
  deltaECMC,
  deltaEITP,
  deltaEJz,
  deltaEOK,
  HSL,
  HSV,
  HWB,
  inGamut,
  // Lab_D65,
  Lab,
  LCH,
  OKLab,
  OKLCH,
  P3,
  P3_Linear,
  ProPhoto,
  ProPhoto_Linear,
  REC_2020,
  REC_2020_Linear,
  serialize,
  sRGB,
  sRGB_Linear,
  to as convert,
  toGamut,
  XYZ_ABS_D65,
  XYZ_D50,
  XYZ_D65
} from 'colorjs.io/fn'
export type { Color, ColorFormat, ColorSpaceId } from 'colorjs.io/fn'

import type { Color } from 'colorjs.io/fn'
import { clone, getColor } from 'colorjs.io/fn'

export const fixNaN = (color: Color): Color => {
  if (color.space.id === 'oklch') {
    return {
      alpha: color.alpha,
      coords: color.coords.map((value) => {
        if (isNaN(value)) {
          /* console.warn(`NaN for [${r}, ${g}, ${b}]`) */

          return 0
        }

        return value
      }) as [number, number, number],
      space: color.space
    }
  }

  return color
}

export const parse = (color: Color | string): Color => clone(getColor(color))

// export const convert: typeof to = (color, space, options) =>
//   to(color, space, options)
//
// export const serialize: typeof _serialize = (color, options) =>
//   _serialize(color, options)
//
// export const toGamut: typeof _toGamut = (color, options) =>
//   _toGamut(color, options)
