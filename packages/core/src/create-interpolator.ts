import { INTERPOLATOR } from './constants'
import { parseModel } from './parse-model'
import {
  Interpolator,
  Line,
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

export const createInterpolator = (
  value: unknown,
  initialSate?: Partial<State>
): Interpolator => {
  const triangle = [] as unknown as Triangle
  const subscriptions = new Set<Subscription>()

  const model = parseModel(value)

  const state: State = {
    lightness: [0, 1],
    chroma: [0, 1],
    darkMode: false,
    ...initialSate
  }

  const [v0, v1, v2] = model.triangle
  const x0 = intersection([v0, v2], [v1, [v1[0], 0]]) as Point

  let p0: Point
  let p1: Point

  const lightness1 = () => {
    triangle[2] = lerpArray(p0, p1, state.lightness[1]) as Point
  }

  const lightness0 = () => {
    triangle[0] = lerpArray(p1, p0, 1 - state.lightness[0]) as Point
  }

  const chroma1 = () => {
    triangle[1] = lerpArray(x0, v1, state.chroma[1]) as Point
  }

  const chroma0 = () => {
    const x1 = lerpArray(x0, v1, state.chroma[0]) as Point

    const delta = x1[1] - x0[1]

    if (delta === 0) {
      p0 = [...v0]
      p1 = [...v2]
    } else {
      const ab = [v0, v2].map(
        (point): Point => [point[0], point[1] + delta]
      ) as Line

      // can this break?
      p0 = intersection(ab, [v0, v1]) as Point
      p1 = intersection(ab, [v1, v2]) as Point
    }

    lightness0()
    lightness1()
  }

  chroma0()
  chroma1()

  const updateChroma = (a?: number, b?: number) => {
    let changed = false

    if (a !== undefined && a !== state.chroma[0]) {
      state.chroma[0] = a
      chroma0()
      changed = true
    }

    if (b !== undefined && b !== state.chroma[1]) {
      state.chroma[1] = b
      chroma1()
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
      lightness1()
      changed = true
    }

    if (a !== undefined && a !== state.lightness[0]) {
      state.lightness[0] = a
      lightness0()
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
