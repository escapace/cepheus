import { median } from 'simple-statistics'
import { divisors } from './utilities/divisors'

export const OPTIMIZE_RANGE_MAX = 120
export const OPTIMIZE_RANGE_DIVISORS = divisors(OPTIMIZE_RANGE_MAX).filter(
  (value) => value !== 1
)

export const DEFAULT_OPTIMIZE_RANGE_DIVISOR = median(
  OPTIMIZE_RANGE_DIVISORS.slice(0, Math.max(OPTIMIZE_RANGE_DIVISORS.length / 2))
)

export const DEFAULT_ITERATIONS = 4
