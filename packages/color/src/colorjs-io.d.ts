/* eslint-disable @typescript-eslint/naming-convention */

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

  export abstract class ColorSpace {
    id: ColorSpaceId
    static get(id: ColorSpaceId): ColorSpace
    static register(space: ColorSpace): void
  }

  export const XYZ_D65: InstanceType<typeof ColorSpace>
  export const XYZ_D50: InstanceType<typeof ColorSpace>
  export const XYZ_ABS_D65: InstanceType<typeof ColorSpace>
  export const Lab_D65: InstanceType<typeof ColorSpace>
  export const Lab: InstanceType<typeof ColorSpace>
  export const LCH: InstanceType<typeof ColorSpace>
  export const sRGB_Linear: InstanceType<typeof ColorSpace>
  export const sRGB: InstanceType<typeof ColorSpace>
  export const HSL: InstanceType<typeof ColorSpace>
  export const HWB: InstanceType<typeof ColorSpace>
  export const HSV: InstanceType<typeof ColorSpace>
  export const P3_Linear: InstanceType<typeof ColorSpace>
  export const P3: InstanceType<typeof ColorSpace>
  export const A98RGB_Linear: InstanceType<typeof ColorSpace>
  export const A98RGB: InstanceType<typeof ColorSpace>
  export const ProPhoto_Linear: InstanceType<typeof ColorSpace>
  export const ProPhoto: InstanceType<typeof ColorSpace>
  export const REC_2020_Linear: InstanceType<typeof ColorSpace>
  export const REC_2020: InstanceType<typeof ColorSpace>
  export const OKLab: InstanceType<typeof ColorSpace>
  export const OKLCH: InstanceType<typeof ColorSpace>

  export interface Color {
    alpha: number
    coords: [number, number, number]
    space: ColorSpace
  }

  export const deltaE76: (color: Color, sample: Color) => number
  export const deltaECMC: (color: Color, sample: Color) => number
  export const deltaE2000: (color: Color, sample: Color) => number
  export const deltaEJz: (color: Color, sample: Color) => number
  export const deltaEITP: (color: Color, sample: Color) => number
  export const deltaEOK: (color: Color, sample: Color) => number

  export const contrastWCAG21: (color1: Color, color2: Color) => number
  export const contrastAPCA: (background: Color, foreground: Color) => number
  export const contrastMichelson: (color1: Color, color2: Color) => number
  export const contrastWeber: (color1: Color, color2: Color) => number
  export const contrastLstar: (color1: Color, color2: Color) => number
  export const contrastDeltaPhi: (color1: Color, color2: Color) => number
  // export type ColorContrast =
  //   | 'WCAG21'
  //   | 'APCA'
  //   | 'Michelson'
  //   | 'Weber'
  //   | 'Lstar'
  //   | 'DeltaPhi'
  //
  // export const contrast: (
  //   background: Color,
  //   foreground: Color,
  //   options?: { algorithm: ColorContrast }
  // ) => number

  export const clone: (color: Color) => Color
  export const to: (
    color: Color,
    space: ColorSpace,
    options?: { inGamut?: boolean }
  ) => Color

  export interface DenormalizedColor {
    alpha?: number
    coords: number[]
    space?: ColorSpace
    spaceId: ColorSpaceId
  }

  // export const parse: (value: string) => DenormalizedColor
  export const getColor: (color: Color | DenormalizedColor | string) => Color

  type ColorFormat =
    | 'color'
    | 'default'
    | 'hex'
    | 'hsl'
    | 'hsla'
    | 'hwb'
    | 'keyword'
    | 'lab'
    | 'lch'
    | 'oklab'
    | 'oklch'
    | 'rgb'
    | 'rgba'

  export const serialize: (
    color: Color,
    options?: {
      format: ColorFormat
      inGamut?: boolean
      precision?: number
    }
  ) => string

  export const inGamut: (color: Color, space?: ColorSpace) => boolean

  export const toGamut: (
    color: Color,
    options?: {
      deltaEMethod?:
        | 'deltaE2000'
        | 'deltaE76'
        | 'deltaECMC'
        | 'deltaEHCT'
        | 'deltaEITP'
        | 'deltaEJz'
        | 'deltaEOK'
      jnd?: number
      method?: 'clip' | 'css'
      space?: ColorSpace
    }
  ) => Color
}
