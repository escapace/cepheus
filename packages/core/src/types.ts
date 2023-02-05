export type Point = [x: number, y: number]
export type Triangle = [Point, Point, Point]
export type Line = [Point, Point]
export type ModelUnparsed = [
  interval: number,
  length: number,
  triangle: [...Point, ...Point, ...Point],
  squares: number[],
  colors: number[]
]

export interface ModelParsed {
  colors: Map<number, Array<[number, number, number]>>
  interval: number
  length: number
  squares: number[]
  triangle: Triangle
}

export interface State {
  lightness: [low: number, high: number]
  chroma: [low: number, high: number]
  darkMode: boolean
}

export type Unsubscribe = () => void
export type Subscription = () => void

export interface Interpolator {
  triangle: () => Readonly<Triangle>
  lightness: () => Readonly<State['lightness']>
  chroma: () => Readonly<State['chroma']>
  darkMode: () => Readonly<State['darkMode']>
  updateLightness: (a?: number, b?: number) => void
  updateChroma: (a?: number, b?: number) => void
  updateDarkMode: (value: boolean) => void
  subscribe: (cb: Subscription) => Unsubscribe
  cartesian: (
    color: number,
    x: number,
    y: number,
    extend?: boolean
  ) => [number, number, number] | undefined
  barycentric: (
    color: number,
    alpha: number,
    beta: number,
    gamma: number,
    invert?: boolean
  ) => [number, number, number] | undefined
  get: (
    color: number,
    chroma: number,
    lightness: number,
    invert?: boolean
  ) => [number, number, number] | undefined
}
