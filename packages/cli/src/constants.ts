import { median } from 'simple-statistics'
import { divisors } from './utilities/divisors'
import { N } from '@cepheus/utilities'

export const N_DIVISORS = divisors(N).filter((value) => value !== 1)
export const DEFAULT_N_DIVISOR = median(
  N_DIVISORS.slice(0, Math.max(N_DIVISORS.length / 2))
)

export const DEFAULT_ITERATIONS = 4
