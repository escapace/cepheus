import { divisors } from '@cepheus/utilities'
import { CEPHEUS_SIDE_LENGTH } from 'cepheus'
import { median } from 'simple-statistics'
import type { OptimizeOptions } from './types'
import { normalizeWeights } from './utilities/normalize-weights'

export const SIDE_LENGTH = CEPHEUS_SIDE_LENGTH
export const SIDE_LENGTH_DIVISORS = divisors(SIDE_LENGTH).filter((value) => value !== 1)
export const DEFAULT_SIDE_LENGTH_DIVISOR = median(
  SIDE_LENGTH_DIVISORS.slice(0, Math.max(SIDE_LENGTH_DIVISORS.length / 2)),
)

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
