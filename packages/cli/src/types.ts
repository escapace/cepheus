import type { ColorSpace, PlainColorObject } from 'colorjs.io/fn'
import type { DeepRequired } from 'utility-types'
import type { PRNG, PRNGName } from './utilities/create-prng'
export type { PRNG, PRNGName }

export type Color = [number, number, number]

export type ColorGamut = 'p3' | 'srgb'
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
  deltaE?: 'jzczhz' | 'oklab'
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
  deltaE: 'jzczhz' | 'oklab'
  hueAngle: OptimizeOptions['hueAngle']
  interval: number
  iterations: number
  precision: number
  weights: OptimizeOptions['weights']
}

export interface OptimizeTaskOptions extends OptimizeOptions {
  key: string
}

export interface SquareOptions {
  chroma: { range: [number, number]; target: number }
  lightness: { range: [number, number]; target: number }
  colors?: number[]
}

export interface OptimizeOptions {
  colorGamut: ColorGamut
  colors: Array<Array<[number, number, number]> | null>
  colorSpace: ColorSpaceLiteral
  deltaE: 'jzczhz' | 'oklab'
  hueAngle: number
  randomSeed: string
  weights: {
    chroma: number
    colors: number
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
  chroma?: Partial<SquareOptions['chroma']>
  hyperparameters?: {
    /* Total number of proposal steps to plan for. */
    iterations: number
    /* Target probability of accepting a worse move at the final step. */
    acceptanceProbabilityTarget: number
    /* Fraction of the run that determines the EMA time constant. */
    movingAverageWindowRatio: number
    /* Winsorisation factor that limits the influence of large |Δcost| spikes. */
    movingAverageWeightClippingFactor: number
  }
  lightness?: Partial<SquareOptions['lightness']>
  randomSource?: PRNGName
  tolerance?: number
}

export type RequiredOptimizeOptions = {
  distance: (a: [number, number, number], b: [number, number, number]) => number
  distanceColorOjbect: (a: PlainColorObject, b: PlainColorObject) => number

  colorGamut: ColorGamut
  colors: Array<Array<[number, number, number]> | null>
  colorSpace: ColorSpace
  // costs: Partial<Record<keyof OptimizeOptions['weights'], [number, number]>>
  prng: PRNG
} & DeepRequired<
  Omit<OptimizeOptions, 'colorGamut' | 'colors' | 'colorSpace' | 'randomSeed' | 'randomSource'>
>

export const enum TypeOptimizationState {
  Pending,
  Rejected,
  Fulfilled,
}

interface IOptimizationState {
  type: TypeOptimizationState
}

export interface OptimizationStateFulfilled<PARTIAL extends 'false' | 'true' = 'true'>
  extends IOptimizationState {
  colors: {
    false: Array<[number, number, number]>
    true: Array<[number, number, number] | null>
  }[PARTIAL]
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
