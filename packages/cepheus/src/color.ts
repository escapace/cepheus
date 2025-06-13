import { barycentric } from './barycentric'
import { INTERPOLATOR, MAX } from './constants'
import type { Interpolator } from './types'

export const color = (
  interpolator: Interpolator,
  color: number | string,
  lightness: number,
  chroma: number,
  invert = false,
) => {
  const alias = interpolator[INTERPOLATOR].state.palette.alias

  const index = alias === undefined ? color : alias(color)

  if (typeof index !== 'number') {
    return
  }

  return barycentric(interpolator, index, MAX - lightness, chroma, lightness, invert)
}
