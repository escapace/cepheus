/* eslint-disable @typescript-eslint/no-extraneous-class */
declare module 'colorjs.io/fn' {
  export type ColorSpaceId =
    | 'a98rgb-linear'
    | 'a98rgb'
    | 'acescc'
    | 'acescg'
    | 'hsl'
    | 'hsv'
    | 'hwb'
    | 'ictcp'
    | 'jzazbz'
    | 'jzczhz'
    | 'lab-d65'
    | 'lab'
    | 'lch'
    | 'oklab'
    | 'oklch'
    | 'p3-linear'
    | 'p3'
    | 'prophoto-linear'
    | 'prophoto'
    | 'rec2020-linear'
    | 'rec2020'
    | 'rec2100hlg'
    | 'rec2100pq'
    | 'srgb-linear'
    | 'srgb'
    | 'xyz-abs-d65'
    | 'xyz-d50'
    | 'xyz-d65'

  export class ColorSpace {
    static register(space: ColorSpace): void
    static get(id: ColorSpaceId): ColorSpace
  }

  export class XYZ_D65 extends ColorSpace {}
  export class XYZ_D50 extends ColorSpace {}
  export class XYZ_ABS_D65 extends ColorSpace {}
  export class Lab_D65 extends ColorSpace {}
  export class Lab extends ColorSpace {}
  export class LCH extends ColorSpace {}
  export class sRGB_Linear extends ColorSpace {}
  export class sRGB extends ColorSpace {}
  export class HSL extends ColorSpace {}
  export class HWB extends ColorSpace {}
  export class HSV extends ColorSpace {}
  export class P3_Linear extends ColorSpace {}
  export class P3 extends ColorSpace {}
  export class A98RGB_Linear extends ColorSpace {}
  export class A98RGB extends ColorSpace {}
  export class ProPhoto_Linear extends ColorSpace {}
  export class ProPhoto extends ColorSpace {}
  export class REC_2020_Linear extends ColorSpace {}
  export class REC_2020 extends ColorSpace {}
  export class OKLab extends ColorSpace {}
  export class OKLCH extends ColorSpace {}

  export interface Color {
    space: ColorSpace
    coords: number[]
    alpha: number
  }

  export const deltaE76: (color: Color, sample: Color) => number
  export const deltaECMC: (color: Color, sample: Color) => number
  export const deltaE2000: (color: Color, sample: Color) => number
  export const deltaEJz: (color: Color, sample: Color) => number
  export const deltaEITP: (color: Color, sample: Color) => number
  export const deltaEOK: (color: Color, sample: Color) => number

  export type ColorContrast =
    | 'WCAG21'
    | 'APCA'
    | 'Michelson'
    | 'Weber'
    | 'Lstar'
    | 'DeltaPhi'

  export const contrast: (
    background: Color,
    foreground: Color,
    options?: {}
  ) => number

  export const clone: (color: Color) => Color
  export const to: (
    color: Color,
    space: ColorSpace,
    options?: { inGamut?: boolean }
  ) => Color

  export interface DenormalizedColor {
    space?: ColorSpace
    spaceId: ColorSpaceId
    coords: number[]
    alpha?: number
  }

  // export const parse: (value: string) => DenormalizedColor
  export const getColor: (color: DenormalizedColor | Color | string) => Color

  type ColorFormat =
    | 'default'
    | 'color'
    | 'hsl'
    | 'hsla'
    | 'hwb'
    | 'lab'
    | 'lch'
    | 'oklab'
    | 'oklch'
    | 'rgb'
    | 'rgba'
    | 'hex'
    | 'keyword'

  export const serialize: (
    color: Color,
    options?: {
      precision?: number
      format: ColorFormat
      inGamut?: boolean
    }
  ) => string
}
