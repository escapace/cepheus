import { barycentric } from './barycentric'
import { INTERPOLATOR, MAX } from './constants'
import { Interpolator } from './types'

function isNumeric(value: string): boolean {
  return /^\d+$/.test(value)
}

export const color = (
  interpolator: Interpolator,
  color: string | number,
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

  const fn = interpolator[INTERPOLATOR].state.model.alias

  const n = fn === undefined ? c : fn(c)

  if (typeof n !== 'number') {
    throw new Error(`Unknown color ${typeof n === 'string' ? n : 'undefined'}`)
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
