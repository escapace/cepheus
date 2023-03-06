import { barycentric } from './barycentric'
import { MAX } from './constants'
import { Interpolator } from './types'

export const color = (
  interpolator: Interpolator,
  color: number,
  chroma: number,
  lightness: number,
  invert = false
) => {
  // TODO: alias
  return barycentric(
    interpolator,
    color,
    MAX - lightness,
    chroma,
    lightness,
    invert
  )
}
