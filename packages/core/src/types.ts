import type { Color, ColorSpace } from '@escapace/bruni-color'
import type { ColorSpaceId } from 'colorjs.io/fn'
import type { DeepRequired } from 'utility-types'
import type { PRNG, PRNGName } from './utilities/create-prng'

export { PRNG, PRNGName }

export type INTERVAL = 2 | 4 | 5 | 10 | 20 | 25 | 50

export interface Cube {
  interval: INTERVAL
  position: number
}

export interface Task<T extends OptimizationState = OptimizationState> {
  state: T
  options: TaskOptions
}

export enum TypeBruniState {
  None,
  OptimizationDone,
  OptimizationError,
  OptimizationAbort,
  Done
}

export interface BruniStateNone {
  type: TypeBruniState.None
}

export interface BruniStateOptimizationDone {
  type: TypeBruniState.OptimizationDone
}

export interface BruniStateOptimizationError {
  type: TypeBruniState.OptimizationError
  error: unknown
}

export interface BruniStateOptimizationAbort {
  type: TypeBruniState.OptimizationAbort
}

export interface BruniStateDone {
  type: TypeBruniState.Done
}

export type BruniState =
  | BruniStateNone
  | BruniStateOptimizationDone
  | BruniStateOptimizationError
  | BruniStateOptimizationAbort
  | BruniStateDone

export interface StoreOptions
  extends Omit<
    OptimizeOptions,
    'colors' | 'background' | 'lightness' | 'chroma' | 'contrast'
  > {
  colors: Color[] | string[]
  background: Color | string
  levels?: INTERVAL
  tries?: number
}

export interface RequiredStoreOptions
  extends Omit<StoreOptions, 'colors' | 'background' | 'levels'> {
  colors: Array<[number, number, number]>
  background: [number, number, number]
  interval: INTERVAL
  tries: number
}

export interface TaskOptions extends OptimizeOptions {
  key: string
}

export interface OptimizeOptions {
  randomSeed: string
  randomSource?: PRNGName
  colors: Array<[number, number, number]>
  background: [number, number, number]
  colorSpace?: ColorSpaceId
  hyperparameters?: {
    temperature: number
    coolingRate: number
    cutoff: number
  }
  weights?: {
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
  contrast?: {
    // APCA [0, 106] or [0, 108]
    target?: number
    /* APCA reports lightness contrast as an Lc value from Lc 0 to Lc 106 for dark
     * text on a light background, and Lc 0 to Lc -108 for light text on a dark
     * background (dark mode). The minus sign merely indicates negative contrast,
     * which means light text on a dark background. */
    range?: [number, number]
  }
}

export type RequiredOptimizeOptions = DeepRequired<
  Omit<
    OptimizeOptions,
    'colorSpace' | 'colors' | 'background' | 'randomSeed' | 'randomSource'
  >
> & {
  prng: PRNG
  colorSpace: ColorSpace
  colors: Color[]
  background: Color
  isDarkMode: boolean
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
