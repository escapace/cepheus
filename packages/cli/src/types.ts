import type { ColorSpace, PlainColorObject } from 'colorjs.io/fn'
import type { DeepRequired } from 'utility-types'
import type { PRNG, PRNGName } from './utilities/create-prng'
export type { PRNG, PRNGName }

export type Square = number

type ColorGamut = 'p3' | 'srgb'
type ColorSpaceLiteral = 'oklch' | 'oklrch'

export interface OptimizeTask<T extends OptimizationState = OptimizationState> {
  options: OptimizeTaskOptions
  state: T
}

export enum TypeCepheusState {
  Abort,
  Done,
  Error,
  Optimization,
  OptimizationDone,
}

export interface CepheusStateOptimization {
  type: TypeCepheusState.Optimization
}

export interface CepheusStateOptimizationDone {
  type: TypeCepheusState.OptimizationDone
}

export interface CepheusStateAbort {
  type: TypeCepheusState.Abort
}

export interface CepheusStateDone {
  type: TypeCepheusState.Done
}

export interface CepheusStateError {
  error: unknown
  type: TypeCepheusState.Error
}

export type CepheusState =
  | CepheusStateAbort
  | CepheusStateDone
  | CepheusStateError
  | CepheusStateOptimization
  | CepheusStateOptimizationDone

export interface StoreOptions
  extends Omit<
    OptimizeOptions,
    | 'background'
    | 'chroma'
    | 'colorGamut'
    | 'colors'
    | 'colorSpace'
    | 'deltaE'
    | 'hueAngle'
    | 'lightness'
    | 'tolerance'
    | 'weights'
  > {
  colors: Array<Array<[number, number, number]> | string[]>
  colorGamut?: 'p3' | 'srgb'
  colorSpace?: ColorSpaceLiteral
  deltaE?: 'jzczhz' | 'ok2'
  hueAngle?: OptimizeOptions['hueAngle']
  iterations?: number
  levels?: number
  precision?: number
  weights?: OptimizeOptions['weights']
}

export interface RequiredStoreOptions
  extends Omit<
    StoreOptions,
    'colorGamut' | 'colors' | 'colorSpace' | 'hueAngle' | 'levels' | 'precision' | 'weights'
  > {
  colorGamut: ColorGamut
  colors: Array<Array<[number, number, number]>>
  colorSpace: ColorSpaceLiteral
  deltaE: 'jzczhz' | 'ok2'
  hueAngle: OptimizeOptions['hueAngle']
  interval: number
  iterations: number
  precision: number
  weights: OptimizeOptions['weights']
}

export interface OptimizeTaskOptions extends OptimizeOptions {
  key: string
}

export interface OptimizeOptions {
  background: Array<[number, number, number]>
  colorGamut: ColorGamut
  colors: Array<Array<[number, number, number]>>
  colorSpace: ColorSpaceLiteral
  deltaE: 'jzczhz' | 'ok2'
  hueAngle: number
  randomSeed: string
  weights: {
    chroma: number
    contrast: number
    deuteranopia: number
    difference: number
    dispersionDeuteranopia: number
    dispersionNormal: number
    dispersionProtanopia: number
    dispersionTritanopia: number
    hue: number
    lightness: number
    normal: number
    protanopia: number
    tritanopia: number
  }
  chroma?: {
    range?: [number, number]
    // Chroma [0, 0.4]
    target?: number
  }
  hyperparameters?: {
    coolingRate: number
    cutoff: number
    temperature: number
  }
  lightness?: {
    range?: [number, number]
    // Lightness [0, 1]
    target?: number
  }
  randomSource?: PRNGName
  tolerance?: number
  // contrast?: {
  //   // APCA [0, 106] or [0, 108]
  //   target?: number
  //   /* APCA reports lightness contrast as an Lc value from Lc 0 to Lc 106 for dark
  //    * text on a light background, and Lc 0 to Lc -108 for light text on a dark
  //    * background (dark mode). The minus sign merely indicates negative contrast,
  //    * which means light text on a dark background. */
  //   range?: [number, number]
  // }
}

export type RequiredOptimizeOptions = {
  distance: (a: [number, number, number], b: [number, number, number]) => number
  distanceColorOjbect: (a: PlainColorObject, b: PlainColorObject) => number

  background: Array<[number, number, number]>
  colorGamut: ColorGamut
  colors: Array<Array<[number, number, number]>>
  colorSpace: ColorSpace
  costs: Partial<Record<keyof OptimizeOptions['weights'], [number, number]>>
  prng: PRNG
} & DeepRequired<
  Omit<
    OptimizeOptions,
    'background' | 'colorGamut' | 'colors' | 'colorSpace' | 'randomSeed' | 'randomSource'
  >
>

export const enum TypeOptimizationState {
  Pending,
  Rejected,
  Fulfilled,
}

interface IOptimizationState {
  type: TypeOptimizationState
}

export interface OptimizationStateFulfilled extends IOptimizationState {
  colors: Array<[number, number, number]>
  cost: number
  type: TypeOptimizationState.Fulfilled
}

export interface OptimizationStateRejected extends IOptimizationState {
  type: TypeOptimizationState.Rejected
}

export interface OptimizationStatePending extends IOptimizationState {
  type: TypeOptimizationState.Pending
}

export type OptimizationState =
  | OptimizationStateFulfilled
  | OptimizationStatePending
  | OptimizationStateRejected
