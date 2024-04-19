import { barycentric } from './barycentric'
import { INTERPOLATOR, MAX } from './constants'
import type { Interpolator } from './types'

function isNumeric(value: string): boolean {
  return /^\d+$/.test(value)
}

export const color = (
  interpolator: Interpolator,
  color: number | string,
  chroma: number,
  lightness: number,
  invert = false
) => {
  const c =
    typeof color === 'string'
      ? isNumeric(color)
        ? parseInt(color, 10)
        : color
      : color

  const function_ = interpolator[INTERPOLATOR].state.model.alias

  const n = function_ === undefined ? c : function_(c)

  if (typeof n !== 'number') {
    throw new TypeError(
      `Unknown color ${typeof n === 'string' ? n : 'undefined'}`
    )
  }

  return barycentric(
    interpolator,
    n,
    MAX - lightness,
    chroma,
    lightness,
    invert
  )
}
