import { LENGTH } from 'cepheus'
import { cartesianProduct } from './cartesian-product'
import { toSquare } from './to-square'

export const tile = (interval: number): number[] => {
  // Validate that interval is a divisor
  if (LENGTH % interval !== 0) {
    throw new Error(`Interval ${interval} is not a divisor of ${LENGTH}`)
  }

  // Calculate how many subdivisions we need along each axis
  const divisions = LENGTH / interval

  // Generate arrays of x and y coordinates for bottom-left corners
  const xCoords: number[] = []
  const yCoords: number[] = []

  for (let index = 0; index < divisions; index++) {
    xCoords.push(index * interval)
    yCoords.push(index * interval)
  }

  // Use cartesian product to get all combinations
  return cartesianProduct(xCoords, yCoords).map((value): number =>
    toSquare(value as [number, number], interval),
  )
}
