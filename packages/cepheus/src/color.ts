import { barycentric } from './barycentric'
import { CEPHEUS_FULL_SCALE, CEPHEUS_INTERPOLATOR } from './constants'
import type { Interpolator } from './types'

export const color = (
  interpolator: Interpolator,
  color: number | string,
  lightness: number,
  chroma: number,
  invert = false,
  extended = false,
) => {
  const { alias } = interpolator[CEPHEUS_INTERPOLATOR].state.palette

  const index = alias === undefined ? color : alias(color)

  if (typeof index !== 'number') {
    return
  }

  return barycentric(
    interpolator,
    index,
    CEPHEUS_FULL_SCALE - lightness,
    chroma,
    lightness,
    invert,
    extended,
  )
}
