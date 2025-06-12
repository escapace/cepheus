import { clamp, convexHull, szudzik2, toPosition, unszudzik2 } from '@cepheus/utilities'
import { minTriangle } from '@escapace/minimum-perimeter-triangle'
import type { Point, Triangle } from 'cepheus'
import { sortBy } from 'lodash-es'
import assert from 'node:assert'
import { N } from '../constants'
import { distance } from './distance'

export const createMinimumPerimeterTriangle = (squares: number[], interval: number) => {
  const index = new Set<number>()

  squares.forEach((value) => {
    const [x, y] = toPosition(value, interval)

    index.add(szudzik2(x, y))
    index.add(szudzik2(x, y + interval))
    index.add(szudzik2(x + interval, y + interval))
    index.add(szudzik2(x + interval, y))
  })

  const points = Array.from(index).map((key) => unszudzik2(key))
  const hull = convexHull(points).map((value) => ({ x: value[0], y: value[1] }))

  const result = minTriangle(hull, 10 ** -5, 0.1)

  if (result === null) {
    throw new Error('Unable to fit triangle')
  }

  const trianglePoints: Point[] = [
    [result.A.x, result.A.y],
    [result.B.x, result.B.y],
    [result.C.x, result.C.y],
  ]

  const A = sortBy(trianglePoints, (point) => distance(...point, 0, 0))[0].map((value) =>
    clamp(value, 0, N),
  ) as Point
  const B = sortBy(trianglePoints, (point) => distance(...point, N / 2, N))[0].map((value) =>
    clamp(value, 0, N),
  ) as Point
  const C = sortBy(trianglePoints, (point) => distance(...point, N, 0))[0].map((value) =>
    clamp(value, 0, N),
  ) as Point

  assert(A !== B, 'selectorTriangle() unable to produce correct triangle')
  assert(B !== C, 'selectorTriangle() unable to produce correct triangle')
  assert(C !== A, 'selectorTriangle() unable to produce correct triangle')

  const triangle: Triangle = [A, B, C]

  return triangle
}
