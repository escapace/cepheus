import { Model, State, Triangle } from './types'
import {
  chroma0,
  chroma1,
  getX0,
  lightness0,
  lightness1
} from './utilities/calculations'

export const adjust = (model: Model, options: Partial<State> = {}): Model => {
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
