import { Options } from '.'
import { INTERPOLATOR } from './constants'
import { Interpolator, Model, State, Subscription, Triangle } from './types'
import {
  chroma0,
  chroma1,
  getX0,
  lightness0,
  lightness1
} from './utilities/calculations'

const notify = (subscriptions: Set<Subscription>) => {
  for (const subscription of subscriptions) {
    subscription()
  }
}

const changeModel = (
  state: State,
  triangle: Triangle,
  model: Model = state.model
) => {
  const x0 = getX0(model.triangle)

  const { p0, p1 } = chroma0(x0, model.triangle, state)

  const triangle0 = lightness0(p0, p1, state)
  const triangle1 = chroma1(x0, model.triangle[1], state)
  const triangle2 = lightness1(p0, p1, state)

  state.model = model
  triangle[0] = triangle0
  triangle[1] = triangle1
  triangle[2] = triangle2

  return { x0, p0, p1, state }
}

export const createInterpolator = (options: Options): Interpolator => {
  const subscriptions = new Set<Subscription>()
  const triangle: Triangle = [] as unknown as Triangle

  let { state, x0, p0, p1 } = changeModel(
    {
      lightness:
        options.lightness === undefined
          ? [0, 1]
          : [options.lightness[0], options.lightness[1]],
      chroma:
        options.chroma === undefined
          ? [0, 1]
          : [options.chroma[0], options.chroma[1]],
      darkMode: options.darkMode ?? false,
      model: options.model
    },
    triangle
  )

  const updateModel = (model: Model) => {
    if (state.model !== model) {
      const props = changeModel(state, triangle, model)

      x0 = props.x0
      p0 = props.p0
      p1 = props.p1

      notify(subscriptions)
    }
  }

  const updateChroma = (a?: number, b?: number) => {
    let changed = false

    if (a !== undefined && a !== state.chroma[0]) {
      state.chroma[0] = a
      const tmp = chroma0(x0, state.model.triangle, state)
      p0 = tmp.p0
      p1 = tmp.p1
      triangle[0] = lightness0(p0, p1, state)
      triangle[2] = lightness1(p0, p1, state)
      changed = true
    }

    if (b !== undefined && b !== state.chroma[1]) {
      state.chroma[1] = b
      triangle[1] = chroma1(x0, state.model.triangle[1], state)
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
      state,
      triangle,
      updateModel,
      updateChroma,
      updateDarkMode,
      updateLightness,
      subscriptions
    }
  }
}
