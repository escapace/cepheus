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
}

export type Unsubscribe = () => unknown
export type Subscription = () => unknown

export interface State {
  lightness: [low: number, high: number]
  chroma: [low: number, high: number]
  darkMode: boolean
}

export interface Interpolator {
  [INTERPOLATOR]: {
    triangle: Triangle
    model: Readonly<Model>
    state: State
    subscriptions: Set<Subscription>
    updateLightness: (a?: number, b?: number) => void
    updateChroma: (a?: number, b?: number) => void
    updateDarkMode: (value: boolean) => void
  }
}
