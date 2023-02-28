import { range } from 'lodash-es'
import { cartesianProduct } from './cartesian-product'
import { LENGTH as N } from 'cepheus'
import { toSquare } from './to-square'

export const tile = (interval: number): number[] => {
  const tuple = range(0, N, interval)

  return cartesianProduct(tuple, tuple).map((value): number =>
    toSquare(value as [number, number], interval)
  )
}
