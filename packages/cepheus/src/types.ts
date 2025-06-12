import type { INTERPOLATOR } from './constants'

export type Line = [Point, Point]
export type Point = [x: number, y: number]
export type Triangle = [Point, Point, Point]

export type RawPalette = [
  colorGamut: 'p3' | 'srgb',
  interval: number,
  length: number,
  triangle: [...Point, ...Point, ...Point],
  squares: number[],
  colors: number[],
]

export interface Palette {
  colorGamut: 'p3' | 'srgb'
  colors: Map<number, Array<[number, number, number]>>
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
  chroma: { max: number; min: number }
  lightness: { max: number; min: number }
  palette: Palette
}

export interface Options extends Partial<Omit<State, 'palette'>>, Pick<State, 'palette'> {}

export interface Interpolator {
  [INTERPOLATOR]: {
    state: State
    subscriptions: Set<Subscription>
    triangle: Triangle
    updateChroma: (a?: number, b?: number) => Promise<void>
    updateLightness: (a?: number, b?: number) => Promise<void>
    updatePalette: (palette: Palette) => Promise<void>
  }
}
