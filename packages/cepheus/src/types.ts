import type { INTERPOLATOR } from './constants'

export type Line = [Point, Point]
export type Point = [x: number, y: number]
export type Triangle = [Point, Point, Point]

export enum ColorSpace {
  p3 = 1,
  srgb = 0,
}

export type ModelUnparsed = [
  colorSpace: number,
  interval: number,
  length: number,
  triangle: [...Point, ...Point, ...Point],
  squares: number[],
  colors: number[],
]

export interface Model {
  colors: Map<number, Array<[number, number, number]>>
  colorSpace: ColorSpace
  interval: number
  length: number
  squares: number[]
  triangle: Triangle
  alias?: (value: number | string) => number | undefined
}

// eslint-disable-next-line typescript/no-redundant-type-constituents
export type Subscription = () => unknown | Promise<unknown>
export type Unsubscribe = () => unknown

export interface State {
  chroma: [low: number, high: number]
  darkMode: boolean
  lightness: [low: number, high: number]
  model: Model
}

export interface Options extends Partial<Omit<State, 'model'>>, Pick<State, 'model'> {}

export interface Interpolator {
  [INTERPOLATOR]: {
    state: State
    subscriptions: Set<Subscription>
    triangle: Triangle
    updateChroma: (a?: number, b?: number) => Promise<void>
    updateDarkMode: (value: boolean) => Promise<void>
    updateLightness: (a?: number, b?: number) => Promise<void>
    updateModel: (model: Model) => Promise<void>
  }
}
