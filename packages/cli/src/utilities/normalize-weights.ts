import { mapValues } from 'lodash-es'
import { sum } from 'simple-statistics'
import { OptimizeOptions } from '../types'
import { toPrecision } from './to-precision'

export const normalizeWeights = (
  weights: Required<Exclude<OptimizeOptions['weights'], undefined>>
): Required<Exclude<OptimizeOptions['weights'], undefined>> => {
  const total = sum(Object.values(weights))

  return mapValues(weights, (value) => toPrecision(value / total))
}
