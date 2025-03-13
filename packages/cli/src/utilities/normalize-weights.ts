import { mapValues } from 'lodash-es'
import { sum } from 'simple-statistics'
import { toPrecision } from './to-precision'

export const normalizeWeights = <T extends Record<string, number>>(
  weights: T,
  multiplier = 1,
): T => {
  const total = sum(Object.values(weights))

  return mapValues(weights, (value) => toPrecision((value / total) * multiplier)) as T
}
