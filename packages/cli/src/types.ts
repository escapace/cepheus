import type { Color, ColorSpace } from '@cepheus/color'
import type { ColorSpace as ColorSpaceId } from 'cepheus'
import type { DeepRequired } from 'utility-types'
import type { PRNG, PRNGName } from './utilities/create-prng'
export { PRNG, PRNGName }

export type Square = number

export interface OptimizeTask<T extends OptimizationState = OptimizationState> {
  options: OptimizeTaskOptions
  state: T
}

export enum TypeCepheusState {
  Abort,
  Done,
  Error,
  Optimization,
  OptimizationDone
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
    | 'colors'
    | 'colorSpace'
    | 'hueAngle'
    | 'lightness'
    | 'weights'
  > {
  colors: Array<Color[] | string[]>
  colorSpace?: 'p3' | 'srgb'
  hueAngle?: OptimizeOptions['hueAngle']
  iterations?: number
  // background: Color[] | string[]
  levels?: number
  precision?: number
  weights?: OptimizeOptions['weights']
}

export interface RequiredStoreOptions
  extends Omit<
    StoreOptions,
    | 'background'
    | 'colors'
    | 'colorSpace'
    | 'hueAngle'
    | 'levels'
    | 'precision'
    | 'weights'
  > {
  background: Array<[number, number, number]>
  colors: Array<Array<[number, number, number]>>
  colorSpace: ColorSpaceId
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
  chroma?: {
    range?: [number, number]
    // Chroma [0, 0.4]
    target?: number
  }
  colors: Array<Array<[number, number, number]>>
  colorSpace: ColorSpaceId
  hueAngle: number
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
  randomSeed: string
  randomSource?: PRNGName
  weights: {
    chroma: number
    contrast: number
    deuteranopia: number
    difference: number
    dispersion: number
    hue: number
    lightness: number
    normal: number
    protanopia: number
    tritanopia: number
  }
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
  background: Color[]
  colors: Color[][]
  colorSpace: ColorSpace
  prng: PRNG
} & DeepRequired<
  Omit<
    OptimizeOptions,
    'background' | 'colors' | 'colorSpace' | 'randomSeed' | 'randomSource'
  >
>

export const enum TypeOptimizationState {
  Pending,
  Rejected,
  Fulfilled
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
