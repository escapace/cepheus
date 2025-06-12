import { clamp } from './clamp'

export function expandRange(range: [number, number], expansion: number): [number, number] {
  const [a, b] = range

  // Validate range is within [0, 1]
  if (a < 0 || a > 1 || b < 0 || b > 1 || a > b) {
    throw new Error('Range must be within [0, 1] with first value ≤ second value')
  }

  // Clamp expansion to [0, 1]
  const clampedExpansion = clamp(expansion, 0, 1)

  const currentWidth = b - a
  const newWidth = clamp(currentWidth + clampedExpansion, 0, 1)

  const center = (a + b) / 2

  // Calculate ideal bounds (preserving mean)
  let newA = center - newWidth / 2
  let newB = center + newWidth / 2

  // Apply boundary corrections
  if (newA < 0) {
    newA = 0
    newB = newWidth
  } else if (newB > 1) {
    newB = 1
    newA = 1 - newWidth
  }

  return [newA, newB]
}
