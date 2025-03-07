import type { Options } from '.'
import { INTERPOLATOR } from './constants'
import type { Interpolator, Model, State, Subscription, Triangle } from './types'
import { chroma0, chroma1, getX0, lightness0, lightness1 } from './utilities/calculations'

const notify = async (subscriptions: Set<Subscription>) =>
  await Promise.all(Array.from(subscriptions).map((value) => value()))

const changeModel = (state: State, triangle: Triangle, model: Model = state.model) => {
  const x0 = getX0(model.triangle)

  const { p0, p1 } = chroma0(x0, model.triangle, state)

  const triangle0 = lightness0(p0, p1, state)
  const triangle1 = chroma1(x0, model.triangle[1], state)
  const triangle2 = lightness1(p0, p1, state)

  state.model = model
  triangle[0] = triangle0
  triangle[1] = triangle1
  triangle[2] = triangle2

  return { p0, p1, state, x0 }
}

export const createInterpolator = (options: Options): Interpolator => {
  const subscriptions = new Set<Subscription>()
  const triangle: Triangle = [] as unknown as Triangle

  let { p0, p1, state, x0 } = changeModel(
    {
      chroma:
        options.chroma === undefined
          ? { max: 1, min: 0 }
          : { max: options.chroma.max, min: options.chroma.min },
      darkMode: options.darkMode ?? false,
      lightness:
        options.lightness === undefined
          ? { max: 1, min: 0 }
          : { max: options.lightness.max, min: options.lightness.min },
      model: options.model,
    },
    triangle,
  )

  const updateModel = async (model?: Model) => {
    if (model !== undefined && state.model !== model) {
      const properties = changeModel(state, triangle, model)

      x0 = properties.x0
      p0 = properties.p0
      p1 = properties.p1

      await notify(subscriptions)
    }
  }

  const updateChroma = async (a?: number, b?: number) => {
    let changed = false

    if (a !== undefined && a !== state.chroma.min) {
      state.chroma.min = a
      const temporary = chroma0(x0, state.model.triangle, state)
      p0 = temporary.p0
      p1 = temporary.p1
      triangle[0] = lightness0(p0, p1, state)
      triangle[2] = lightness1(p0, p1, state)
      changed = true
    }

    if (b !== undefined && b !== state.chroma.max) {
      state.chroma.max = b
      triangle[1] = chroma1(x0, state.model.triangle[1], state)
      changed = true
    }

    if (changed) {
      await notify(subscriptions)
    }
  }

  const updateLightness = async (a?: number, b?: number) => {
    let changed = false

    if (b !== undefined && b !== state.lightness.max) {
      state.lightness.max = b
      triangle[2] = lightness1(p0, p1, state)
      changed = true
    }

    if (a !== undefined && a !== state.lightness.min) {
      state.lightness.min = a
      triangle[0] = lightness0(p0, p1, state)
      changed = true
    }

    if (changed) {
      await notify(subscriptions)
    }
  }

  const updateDarkMode = async (value?: boolean) => {
    if (value === undefined) {
      return
    }

    if (value !== state.darkMode) {
      state.darkMode = value

      await notify(subscriptions)
    }
  }

  return {
    [INTERPOLATOR]: {
      state,
      subscriptions,
      triangle,
      updateChroma,
      updateDarkMode,
      updateLightness,
      updateModel,
    },
  }
}
