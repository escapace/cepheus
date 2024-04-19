import type { PRNG } from './create-prng'
import { clamp } from './clamp'
import { randomWithin } from './random-within'

export const percentile = (
  current: number,
  percent: number,
  min: number,
  max: number,
  prng: PRNG
) => {
  const value = percent * (max - min)

  return clamp(current + randomWithin(-1 * value, value, prng), min, max)
}
