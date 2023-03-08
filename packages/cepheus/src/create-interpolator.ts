import { INTERPOLATOR } from './constants'
import { isModel } from './is-model'
import { parseModel } from './parse-model'
import {
  Interpolator,
  Line,
  Model,
  Options,
  Point,
  State,
  Subscription,
  Triangle
} from './types'
import { intersection } from './utilities/intersection'
import { lerpArray } from './utilities/lerp-array'

const notify = (subscriptions: Set<Subscription>) => {
  for (const subscription of subscriptions) {
    subscription()
  }
}

const lightness1 = (p0: Point, p1: Point, state: Pick<State, 'lightness'>) =>
  lerpArray(p0, p1, state.lightness[1]) as Point
const lightness0 = (p0: Point, p1: Point, state: Pick<State, 'lightness'>) =>
  lerpArray(p1, p0, 1 - state.lightness[0]) as Point
const chroma1 = (x0: Point, v1: Point, state: Pick<State, 'chroma'>) =>
  lerpArray(x0, v1, state.chroma[1]) as Point

const chroma0 = (
  x0: Point,
  triangle: Triangle,
  state: Pick<State, 'chroma'>
) => {
  const x1 = lerpArray(x0, triangle[1], state.chroma[0]) as Point

  let p0: Point
  let p1: Point

  const delta = x1[1] - x0[1]

  if (delta === 0) {
    p0 = triangle[0]
    p1 = triangle[2]
  } else {
    const ab = [triangle[0], triangle[2]].map(
      (point): Point => [point[0], point[1] + delta]
    ) as Line

    // can this break?
    p0 = intersection(ab, [triangle[0], triangle[1]]) as Point
    p1 = intersection(ab, [triangle[1], triangle[2]]) as Point
  }

  return { p0, p1 }
}

const getX0 = (triangle: Triangle) => {
  // const x0 = intersection([v0, v2], [v1, [v1[0], 0]]) as Point
  const x0 = intersection(
    [triangle[0], triangle[2]],
    [triangle[1], [triangle[1][0], 0]]
  ) as Point
  // const x0: Point = [
  //   (triangle[0][0] + triangle[2][0]) / 2,
  //   (triangle[0][1] + triangle[2][1]) / 2
  // ]

  return x0
}

export const adjustModel = (
  model: Model,
  options: Partial<Options> = {}
): Model => {
  if (Array.isArray(options?.lightness) || Array.isArray(options?.chroma)) {
    const state = {
      chroma: options.chroma ?? [0, 1],
      lightness: options.lightness ?? [0, 1]
    }

    const x0 = getX0(model.triangle)

    const { p0, p1 } = chroma0(x0, model.triangle, state)

    const triangle: Triangle = [
      lightness0(p0, p1, state),
      chroma1(x0, model.triangle[1], state),
      lightness1(p0, p1, state)
    ]

    return {
      ...model,
      triangle
    }
  }

  return model
}

export const createInterpolator = (
  value: unknown,
  options?: Options
): Interpolator => {
  const model = adjustModel(isModel(value) ? value : parseModel(value), options)

  const triangle = [] as unknown as Triangle
  const subscriptions = new Set<Subscription>()

  const state: State = {
    lightness: [0, 1],
    chroma: [0, 1],
    darkMode: false,
    ...options?.initialState
  }

  const x0 = getX0(model.triangle)

  let { p0, p1 } = chroma0(x0, model.triangle, state)
  triangle[0] = lightness0(p0, p1, state)
  triangle[1] = chroma1(x0, model.triangle[1], state)
  triangle[2] = lightness1(p0, p1, state)

  const updateChroma = (a?: number, b?: number) => {
    let changed = false

    if (a !== undefined && a !== state.chroma[0]) {
      state.chroma[0] = a
      const tmp = chroma0(x0, model.triangle, state)
      p0 = tmp.p0
      p1 = tmp.p1
      triangle[0] = lightness0(p0, p1, state)
      triangle[2] = lightness1(p0, p1, state)
      changed = true
    }

    if (b !== undefined && b !== state.chroma[1]) {
      state.chroma[1] = b
      triangle[1] = chroma1(x0, model.triangle[1], state)
      changed = true
    }

    if (changed) {
      notify(subscriptions)
    }
  }

  const updateLightness = (a?: number, b?: number) => {
    let changed = false

    if (b !== undefined && b !== state.lightness[1]) {
      state.lightness[1] = b
      triangle[2] = lightness1(p0, p1, state)
      changed = true
    }

    if (a !== undefined && a !== state.lightness[0]) {
      state.lightness[0] = a
      triangle[0] = lightness0(p0, p1, state)
      changed = true
    }

    if (changed) {
      notify(subscriptions)
    }
  }

  const updateDarkMode = (value: boolean) => {
    if (value !== state.darkMode) {
      state.darkMode = value

      notify(subscriptions)
    }
  }

  return {
    [INTERPOLATOR]: {
      model,
      state,
      triangle,
      updateChroma,
      updateDarkMode,
      updateLightness,
      subscriptions
    }
  }
}
