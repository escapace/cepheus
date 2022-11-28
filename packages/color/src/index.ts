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
  sRGB,
  sRGB_Linear,
  XYZ_ABS_D65,
  XYZ_D50,
  XYZ_D65
} from 'colorjs.io/fn'
export type { Color, ColorFormat, ColorSpaceId } from 'colorjs.io/fn'

import type { Color } from 'colorjs.io/fn'
import { clone, getColor, serialize as _serialize, to } from 'colorjs.io/fn'

export const fixNaN = (color: Color): Color => {
  if (color.space.id === 'oklch') {
    return {
      space: color.space,
      alpha: color.alpha,
      coords: color.coords.map((value) => {
        if (isNaN(value)) {
          /* console.warn(`NaN for [${r}, ${g}, ${b}]`) */

          return 0
        }

        return value
      }) as [number, number, number]
    }
  }

  return color
}

export const parse = (color: string | Color): Color => clone(getColor(color))
export const convert: typeof to = (color, space, options) =>
  to(clone(color), space, options)

export const serialize: typeof _serialize = (color, options) =>
  _serialize(clone(color), options)
