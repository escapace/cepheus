import { divisors } from '@cepheus/utilities'
import { median } from 'simple-statistics'
import { normalizeWeights } from './utilities/normalize-weights'
import type { OptimizeOptions } from './types'

export const N = 120
export const N_DIVISORS = divisors(N).filter((value) => value !== 1)
export const DEFAULT_N_DIVISOR = median(N_DIVISORS.slice(0, Math.max(N_DIVISORS.length / 2)))

export const DEFAULT_ITERATIONS = 4

export const DEFAULT_HUE_ANGLE = 20

export const DEFAULT_PRECISION = 8

export const DEFAULT_DELTA_E = 'jzczhz'

/* eslint-disable perfectionist/sort-objects */
export const DEFAULT_WEIGHTS = normalizeWeights({
  colors: 25,
  difference: 1,
  ...normalizeWeights(
    {
      hue: 3,
      chroma: 2,
      lightness: 2,
    },
    2,
  ),
  ...normalizeWeights({
    normal: 3,
    deuteranopia: 1,
    protanopia: 1,
    tritanopia: 1,
  }),
  ...normalizeWeights({
    dispersionNormal: 3,
    dispersionDeuteranopia: 1,
    dispersionProtanopia: 1,
    dispersionTritanopia: 1,
  }),
}) satisfies OptimizeOptions['weights']
