import './colorjs-io.d'

export {
  XYZ_D65,
  XYZ_D50,
  XYZ_ABS_D65,
  // Lab_D65,
  Lab,
  LCH,
  sRGB_Linear,
  sRGB,
  HSL,
  HWB,
  HSV,
  P3_Linear,
  P3,
  A98RGB_Linear,
  A98RGB,
  ProPhoto_Linear,
  ProPhoto,
  REC_2020_Linear,
  REC_2020,
  OKLab,
  OKLCH,
  ColorSpace,
  deltaE76,
  deltaECMC,
  deltaE2000,
  deltaEJz,
  deltaEITP,
  deltaEOK,
  clone,
  contrast,
  inGamut
} from 'colorjs.io/fn'

export type { Color, ColorFormat, ColorSpaceId } from 'colorjs.io/fn'

import type { Color } from 'colorjs.io/fn'
import { clone, to, getColor, serialize as _serialize } from 'colorjs.io/fn'

export const parse = (color: string | Color): Color => clone(getColor(color))
export const convert: typeof to = (color, space, options) =>
  to(clone(color), space, options)

export const serialize: typeof _serialize = (color, options) =>
  _serialize(clone(color), options)
