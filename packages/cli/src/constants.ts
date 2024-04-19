import { median } from 'simple-statistics'
import { divisors } from './utilities/divisors'
import { normalizeWeights } from './utilities/normalize-weights'

export const N = 120
export const N_DIVISORS = divisors(N).filter((value) => value !== 1)
export const DEFAULT_N_DIVISOR = median(
  N_DIVISORS.slice(0, Math.max(N_DIVISORS.length / 2))
)

export const DEFAULT_ITERATIONS = 4

export const DEFAULT_HUE_ANGLE = 30

export const DEFAULT_WEIGHTS = normalizeWeights({
  // pushes color to the chroma edge
  chroma: 12,
  // pushes color away from background
  contrast: 6.25,
  deuteranopia: 2.75,
  // pushes color to initial value
  difference: 25,
  dispersion: 10,
  // pushes color away from pallete colors
  hue: 10,
  // pushes color to the lightness edge
  lightness: 8.75,
  normal: 6.5,
  protanopia: 2.75,
  tritanopia: 2.75
})
