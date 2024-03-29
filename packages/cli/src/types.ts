import type { Color, ColorSpace } from '@cepheus/color'
import { ColorSpace as ColorSpaceId } from 'cepheus'
import type { DeepRequired } from 'utility-types'
import type { PRNG, PRNGName } from './utilities/create-prng'
export { PRNG, PRNGName }

export type Square = number

export interface OptimizeTask<T extends OptimizationState = OptimizationState> {
  state: T
  options: OptimizeTaskOptions
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
  type: TypeCepheusState.Error
  error: unknown
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
    | 'colors'
    | 'background'
    | 'lightness'
    | 'chroma'
    | 'colorSpace'
    | 'weights'
    | 'hueAngle'
  > {
  precision?: number
  hueAngle?: OptimizeOptions['hueAngle']
  weights?: OptimizeOptions['weights']
  colorSpace?: 'p3' | 'srgb'
  colors: Array<Color[] | string[]>
  // background: Color[] | string[]
  levels?: number
  iterations?: number
}

export interface RequiredStoreOptions
  extends Omit<
    StoreOptions,
    | 'colors'
    | 'background'
    | 'levels'
    | 'colorSpace'
    | 'weights'
    | 'hueAngle'
    | 'precision'
  > {
  precision: number
  hueAngle: OptimizeOptions['hueAngle']
  weights: OptimizeOptions['weights']
  colorSpace: ColorSpaceId
  colors: Array<Array<[number, number, number]>>
  background: Array<[number, number, number]>
  interval: number
  iterations: number
}

export interface OptimizeTaskOptions extends OptimizeOptions {
  key: string
}

export interface OptimizeOptions {
  randomSeed: string
  randomSource?: PRNGName
  colors: Array<Array<[number, number, number]>>
  background: Array<[number, number, number]>
  colorSpace: ColorSpaceId
  hyperparameters?: {
    temperature: number
    coolingRate: number
    cutoff: number
  }
  hueAngle: number
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
  lightness?: {
    // Lightness [0, 1]
    target?: number
    range?: [number, number]
  }
  chroma?: {
    // Chroma [0, 0.4]
    target?: number
    range?: [number, number]
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

export type RequiredOptimizeOptions = DeepRequired<
  Omit<
    OptimizeOptions,
    'colorSpace' | 'colors' | 'background' | 'randomSeed' | 'randomSource'
  >
> & {
  prng: PRNG
  colorSpace: ColorSpace
  colors: Color[][]
  background: Color[]
}

export const enum TypeOptimizationState {
  Pending,
  Rejected,
  Fulfilled
}

interface IOptimizationState {
  type: TypeOptimizationState
}

export interface OptimizationStateFulfilled extends IOptimizationState {
  type: TypeOptimizationState.Fulfilled
  colors: Array<[number, number, number]>
  cost: number
}

export interface OptimizationStateRejected extends IOptimizationState {
  type: TypeOptimizationState.Rejected
}

export interface OptimizationStatePending extends IOptimizationState {
  type: TypeOptimizationState.Pending
}

export type OptimizationState =
  | OptimizationStateFulfilled
  | OptimizationStateRejected
  | OptimizationStatePending
