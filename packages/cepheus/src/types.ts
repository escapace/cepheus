import type { INTERPOLATOR } from './constants'

export type Line = [Point, Point]
export type Point = [x: number, y: number]
export type Triangle = [Point, Point, Point]

export type RawPalette = [
  colorGamut: string,
  interval: number,
  length: number,
  triangles: number[],
  squares: number[],
  colors: Array<number | null>,
]

export interface Palette {
  colorGamut: 'p3' | 'srgb'
  // colors: Map<number, Array<[number, number, number] | undefined>>
  colors: {
    get: (key: number) => Array<[number, number, number] | undefined> | undefined;
  }
  interval: number
  length: number
  squares: number[]
  triangles: Triangle[]
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
