import type { Options } from '.'
import { CEPHEUS_INTERPOLATOR } from './constants'
import type { Interpolator, Palette, Reference, State, Subscription } from './types'
import { chroma0, chroma1, getX0, lightness0, lightness1 } from './utilities/calculations'

const notify = async (subscriptions: Subscription[]) =>
  await Promise.all(subscriptions.map((value) => value()))

const changePalette = (state: State, references: Reference[], palette: Palette = state.palette) => {
  const { triangles } = palette

  for (let index = 0; index < triangles.length; index++) {
    const triangle = triangles[index]

    const x0 = getX0(triangle)

    const { p0, p1 } = chroma0(x0, triangle, state)

    const triangle0 = lightness0(p0, p1, state)
    const triangle1 = chroma1(x0, triangle[1], state)
    const triangle2 = lightness1(p0, p1, state)

    // if (typeof references[index] === 'object') {
    //   const reference = references[index]
    //   const { triangle } = reference
    //   triangle[0] = triangle0
    //   triangle[1] = triangle1
    //   triangle[2] = triangle2
    //
    //   reference.p0 = p0
    //   reference.p1 = p1
    //   reference.x0 = x0
    // } else {
    references[index] = { p0, p1, triangle: [triangle0, triangle1, triangle2], x0 }
    // }
  }

  state.palette = palette

  return state
}

export const createInterpolator = (options: Options): Interpolator => {
  const subscriptions: Subscription[] = []
  const references: Reference[] = []

  const state = changePalette(
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
    references,
  )

  const updatePalette = async (palette?: Palette) => {
    if (palette !== undefined && state.palette !== palette) {
      changePalette(state, references, palette)
      await notify(subscriptions)
    }
  }

  const updateChroma = async (a?: number, b?: number) => {
    const isMin = a !== undefined && a !== state.chroma.min
    const isMax = b !== undefined && b !== state.chroma.max

    if (isMin) {
      state.chroma.min = a
    }

    if (isMax) {
      state.chroma.max = b
    }

    if (isMin || isMax) {
      const { triangles } = state.palette

      for (let index = 0; index < triangles.length; index++) {
        const triangle = triangles[index]
        const reference = references[index]

        if (isMin) {
          const temporary = chroma0(reference.x0, triangle, state)
          reference.p0 = temporary.p0
          reference.p1 = temporary.p1
          reference.triangle[0] = lightness0(reference.p0, reference.p1, state)
          reference.triangle[2] = lightness1(reference.p0, reference.p1, state)
        }

        if (isMax) {
          reference.triangle[1] = chroma1(reference.x0, triangle[1], state)
        }
      }

      await notify(subscriptions)
    }
  }

  const updateLightness = async (a?: number, b?: number) => {
    const isMin = a !== undefined && a !== state.lightness.min
    const isMax = b !== undefined && b !== state.lightness.max

    if (isMin) {
      state.lightness.min = a
    }

    if (isMax) {
      state.lightness.max = b
    }

    if (isMin || isMax) {
      const { triangles } = state.palette

      for (let index = 0; index < triangles.length; index++) {
        const reference = references[index]

        if (isMax) {
          reference.triangle[2] = lightness1(reference.p0, reference.p1, state)
        }

        if (isMin) {
          reference.triangle[0] = lightness0(reference.p0, reference.p1, state)
        }
      }

      await notify(subscriptions)
    }
  }

  return {
    [CEPHEUS_INTERPOLATOR]: {
      references,
      state,
      subscriptions,
      updateChroma,
      updateLightness,
      updatePalette,
    },
  }
}
