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
    static register(space: ColorSpace): void
    static get(id: ColorSpaceId): ColorSpace
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
    space: ColorSpace
    coords: [number, number, number]
    alpha: number
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

  export const inGamut: (color: Color, space?: ColorSpace) => boolean

  export const toGamut: (
    color: Color,
    options?: {
      method?: 'clip' | 'css'
      jnd?: number
      deltaEMethod?:
        | 'deltaE76'
        | 'deltaECMC'
        | 'deltaE2000'
        | 'deltaEJz'
        | 'deltaEITP'
        | 'deltaEOK'
        | 'deltaEHCT'
      space?: ColorSpace
    }
  ) => Color
}
