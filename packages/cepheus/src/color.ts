import { barycentric } from './barycentric'
import { INTERPOLATOR, MAX } from './constants'
import type { Interpolator } from './types'

export const color = (
  interpolator: Interpolator,
  color: number | string,
  chroma: number,
  lightness: number,
  invert = false,
) => {
  const alias = interpolator[INTERPOLATOR].state.model.alias

  const index = alias === undefined ? color : alias(color)

  if (typeof index !== 'number') {
    throw new TypeError(`cepheus: unknown color index '${index}'`)
  }

  return barycentric(interpolator, index, MAX - lightness, chroma, lightness, invert)
}
