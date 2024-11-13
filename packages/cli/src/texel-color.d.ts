declare module '@texel/color' {
  export interface ColorSpace {
    id: string
    base?: ColorSpace
    fromBase?: (vec: number[], out?: number[]) => number[]
    toBase?: (vec: number[], out?: number[]) => number[]
  }

  export const A98RGB: ColorSpace
  export const A98RGBGamut: { coefficients: number[][][]; space: ColorSpace }
  export const A98RGBLinear: ColorSpace

  export const DisplayP3: ColorSpace
  export const DisplayP3Gamut: { coefficients: number[][][]; space: ColorSpace }
  export const DisplayP3Linear: ColorSpace

  export const MapToCuspL: (oklch: number[], cusp: number[]) => number

  export const OKHSL: ColorSpace
  export const OKHSV: ColorSpace
  export const OKLCH: ColorSpace
  export const OKLab: ColorSpace

  export const ProPhotoRGB: ColorSpace
  export const ProPhotoRGBLinear: ColorSpace

  export const Rec2020: ColorSpace
  export const Rec2020Gamut: { coefficients: number[][][]; space: ColorSpace }
  export const Rec2020Linear: ColorSpace

  export const XYZ: ColorSpace
  export const XYZD50: ColorSpace

  export const clampedRGB: (vec: number[], out?: number[]) => number[]
  export const constrainAngle: (angle: number) => number
  export const convert: (
    input: number[],
    fromSpace: ColorSpace,
    toSpace: ColorSpace,
    out?: number[],
  ) => number[]
  export const degToRad: (degrees: number) => number
  export const deltaEOK: (oklab1: number[], oklab2: number[]) => number
  export const deserialize: (input: string) => { coords: number[]; id: string }
  export const findCuspOKLCH: (
    a: number,
    b: number,
    gamut: { coefficients: number[][][]; space: ColorSpace },
    out?: number[],
  ) => number[]
  export const floatToByte: (float: number) => number
  export const gamutMapOKLCH: (
    oklch: number[],
    gamut?: { coefficients: number[][][]; space: ColorSpace },
    targetSpace?: ColorSpace,
    out?: number[],
    mapping?: (oklch: number[], cusp: number[]) => number,
    cusp?: number[],
  ) => number[]
  export const isRGBInGamut: (rgb: number[], epsilon?: number) => boolean
  export const lerp: (start: number, end: number, t: number) => number
  export const lerpAngle: (start: number, end: number, t: number) => number
  export const listColorGamuts: () => string[]
  export const listColorSpaces: () => string[]
  export const sRGB: ColorSpace
  export const sRGBGamut: { coefficients: number[][][]; space: ColorSpace }
  export const sRGBLinear: ColorSpace
  export const serialize: (
    input: number[],
    inputSpace: ColorSpace,
    outputSpace?: ColorSpace,
  ) => string
}
