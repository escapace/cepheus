import type { Color, ColorSpace } from '@cepheus/color'
import type { ColorSpaceId } from 'colorjs.io/fn'
import type { DeepRequired } from 'utility-types'
import type { PRNG, PRNGName } from './utilities/create-prng'

export { PRNG, PRNGName }

export interface Square {
  interval: number
  position: number
}

export interface Task<T extends OptimizationState = OptimizationState> {
  state: T
  options: TaskOptions
}

export enum TypeCepheusState {
  None,
  OptimizationDone,
  OptimizationAbort,
  Done,
  Error
}

export interface CepheusStateNone {
  type: TypeCepheusState.None
}

export interface CepheusStateOptimizationDone {
  type: TypeCepheusState.OptimizationDone
}

export interface CepheusStateOptimizationAbort {
  type: TypeCepheusState.OptimizationAbort
}

export interface CepheusStateDone {
  type: TypeCepheusState.Done
  model: Model
}

export interface CepheusStateError {
  type: TypeCepheusState.Error
  error: unknown
}

export type CepheusState =
  | CepheusStateNone
  | CepheusStateOptimizationDone
  | CepheusStateOptimizationAbort
  | CepheusStateError
  | CepheusStateDone

export interface StoreOptions
  extends Omit<
    OptimizeOptions,
    'colors' | 'background' | 'lightness' | 'chroma'
  > {
  colors: Color[] | string[]
  background: Color[] | string[]
  levels?: number
  iterations?: number
}

export interface RequiredStoreOptions
  extends Omit<StoreOptions, 'colors' | 'background' | 'levels'> {
  colors: Array<[number, number, number]>
  background: Array<[number, number, number]>
  interval: number
  iterations: number
}

export interface TaskOptions extends OptimizeOptions {
  key: string
}

export interface OptimizeOptions {
  randomSeed: string
  randomSource?: PRNGName
  colors: Array<[number, number, number]>
  colorsSurrounding?: Array<Array<[number, number, number]>>
  colorsPrevious?: Array<[number, number, number]>
  background: Array<[number, number, number]>
  colorSpace?: ColorSpaceId
  hyperparameters?: {
    temperature: number
    coolingRate: number
    cutoff: number
  }
  weights?: {
    surround: number
    chroma: number
    contrast: number
    deuteranopia: number
    difference: number
    dispersion: number
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
    | 'colorSpace'
    | 'colors'
    | 'background'
    | 'randomSeed'
    | 'randomSource'
    | 'colorsPrevious'
    | 'colorsSurrounding'
  >
> & {
  prng: PRNG
  colorSpace: ColorSpace
  colors: Color[]
  colorsSurrounding: Color[][]
  colorsPrevious: Color[]
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

export interface Model {
  squares: Array<[number, Array<[number, number, number]>]>
  interval: number
}
