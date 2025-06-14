import type { Options } from '.'
import { INTERPOLATOR } from './constants'
import type { Interpolator, Palette, State, Subscription, Triangle } from './types'
import { chroma0, chroma1, getX0, lightness0, lightness1 } from './utilities/calculations'

const notify = async (subscriptions: Set<Subscription>) =>
  await Promise.all(Array.from(subscriptions).map((value) => value()))

const changePalette = (state: State, triangleReference: Triangle, palette: Palette = state.palette) => {
  const triangle = palette.triangles[0]

  const x0 = getX0(triangle)

  const { p0, p1 } = chroma0(x0, triangle, state)

  const triangle0 = lightness0(p0, p1, state)
  const triangle1 = chroma1(x0, triangle[1], state)
  const triangle2 = lightness1(p0, p1, state)

  state.palette = palette
  triangleReference[0] = triangle0
  triangleReference[1] = triangle1
  triangleReference[2] = triangle2

  return { p0, p1, state, x0 }
}

export const createInterpolator = (options: Options): Interpolator => {
  const subscriptions = new Set<Subscription>()
  const triangleReference: Triangle = [] as unknown as Triangle

  let { p0, p1, state, x0 } = changePalette(
    {
      chroma:
        options.chroma === undefined
          ? { max: 1, min: 0 }
          : { max: options.chroma.max, min: options.chroma.min },
      lightness:
        options.lightness === undefined
          ? { max: 1, min: 0 }
          : { max: options.lightness.max, min: options.lightness.min },
      palette: options.palette,
    },
    triangleReference,
  )

  const updatePalette = async (palette?: Palette) => {
    if (palette !== undefined && state.palette !== palette) {
      const properties = changePalette(state, triangleReference, palette)

      x0 = properties.x0
      p0 = properties.p0
      p1 = properties.p1

      await notify(subscriptions)
    }
  }

  const updateChroma = async (a?: number, b?: number) => {
    let changed = false
    const triangle = state.palette.triangles[0]

    if (a !== undefined && a !== state.chroma.min) {
      state.chroma.min = a
      const temporary = chroma0(x0, triangle, state)
      p0 = temporary.p0
      p1 = temporary.p1
      triangleReference[0] = lightness0(p0, p1, state)
      triangleReference[2] = lightness1(p0, p1, state)
      changed = true
    }

    if (b !== undefined && b !== state.chroma.max) {
      state.chroma.max = b
      triangleReference[1] = chroma1(x0, triangle[1], state)
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
      triangleReference[2] = lightness1(p0, p1, state)
      changed = true
    }

    if (a !== undefined && a !== state.lightness.min) {
      state.lightness.min = a
      triangleReference[0] = lightness0(p0, p1, state)
      changed = true
    }

    if (changed) {
      await notify(subscriptions)
    }
  }

  return {
    [INTERPOLATOR]: {
      state,
      subscriptions,
      triangle: triangleReference,
      updateChroma,
      updateLightness,
      updatePalette,
    },
  }
}
