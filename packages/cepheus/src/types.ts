import { INTERPOLATOR } from './constants'

export type Point = [x: number, y: number]
export type Triangle = [Point, Point, Point]
export type Line = [Point, Point]

export enum ColorSpace {
  srgb = 0,
  p3 = 1
}

export type ModelUnparsed = [
  colorSpace: number,
  interval: number,
  length: number,
  triangle: [...Point, ...Point, ...Point],
  squares: number[],
  colors: number[]
]

export interface Model {
  colorSpace: ColorSpace
  colors: Map<number, Array<[number, number, number]>>
  interval: number
  length: number
  squares: number[]
  triangle: Triangle
  alias?: (value: string | number) => number | undefined
}

export type Unsubscribe = () => unknown
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type Subscription = () => Promise<unknown> | unknown

export interface State {
  model: Model
  lightness: [low: number, high: number]
  chroma: [low: number, high: number]
  darkMode: boolean
}

export interface Options
  extends Partial<Omit<State, 'model'>>,
    Pick<State, 'model'> {}

export interface Interpolator {
  [INTERPOLATOR]: {
    triangle: Triangle
    state: State
    subscriptions: Set<Subscription>
    updateModel: (model: Model) => Promise<void>
    updateLightness: (a?: number, b?: number) => Promise<void>
    updateChroma: (a?: number, b?: number) => Promise<void>
    updateDarkMode: (value: boolean) => Promise<void>
  }
}
