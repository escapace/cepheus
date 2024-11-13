export const normalizeRange = (range: [number, number], tolerance: number): [number, number] => {
  // Input validation
  if (tolerance < 1) {
    throw new Error('Tolerance must be >= 1')
  }

  if (!range.every((n) => n >= 0 && n <= 1)) {
    throw new Error('Range values must be between 0 and 1')
  }

  // If tolerance is 1, return original range
  if (tolerance === 1) {
    return [...range] as [number, number]
  }

  // Calculate the center point of the range
  const center = (range[0] + range[1]) / 2

  // Calculate the current range size
  const currentSize = range[1] - range[0]

  // Calculate the new range size with tolerance
  const newSize = Math.min(currentSize * tolerance, 1)

  // Calculate new min and max while keeping within [0, 1]
  let newMin = center - newSize / 2
  let newMax = center + newSize / 2

  // Adjust if we exceed boundaries
  if (newMin < 0) {
    newMin = 0
    newMax = newSize
  } else if (newMax > 1) {
    newMax = 1
    newMin = 1 - newSize
  }

  return [newMin, newMax]
}
