import {
  cartesianProduct,
  convexHull,
  szudzik2,
  toPosition,
  toSquare,
  unszudzik2
} from '@cepheus/utilities'
import { minTriangle } from '@escapace/minimum-perimeter-triangle'
import assert from 'assert'
import { normalize, Point, Triangle } from 'cepheus'
import { map, once, range, sortBy } from 'lodash-es'
import { mean, sum } from 'simple-statistics'
// import { mean } from 'simple-statistics'
import { N } from '../constants'
import { OptimizeTaskOptions, Square } from '../types'
import { clamp } from '../utilities/clamp'
import { distance } from '../utilities/distance'
import { toPrecision } from '../utilities/to-precision'
import { Store } from './create-store'
import { selectorSquares } from './selector-squares'

function createMissingSquareOptions(
  store: Store,
  square: Square
): Required<Pick<OptimizeTaskOptions, 'lightness' | 'chroma'>> {
  const squarePosition = toPosition(square, store.options.interval)
  const [squareX, squareY] = squarePosition

  const i = store.options.interval

  const squarePoints: Point[] = [
    [squareX, squareY],
    [squareX, squareY + i],
    [squareX + i, squareY + i],
    [squareX + i, squareY]
  ]

  const squares = Array.from(selectorSquares(store, store.allIterations).keys())

  const closestSquares = sortBy(
    map(squares, (square) => {
      const [x, y] = toPosition(square, i)
      const points: Point[] = [
        [x, y],
        [x, y + i],
        [x + i, y + i],
        [x + i, y]
      ]

      const d = mean(
        points.map((value, index) =>
          Math.abs(distance(...value, ...squarePoints[index]))
        )
      )

      return { square, distance: d }
    }),
    ({ distance }) => distance
  ).slice(0, 4)

  const weights = normalize(
    normalize(closestSquares.map(({ distance }) => distance)).map(
      (value) => 1 - value
    )
  )

  const moves = closestSquares.map(({ square }, index): Point => {
    const [x, y] = toPosition(square, i)
    const weight = weights[index]

    const distanceX = x - squareX
    const distanceY = y - squareY

    return [distanceX * weight, distanceY * weight]
  })

  const positions = [
    squareX + sum(moves.map((value) => value[0])),
    squareY + sum(moves.map((value) => value[1]))
  ]

  const [lightness, chroma] = range(2).map((_, index) => {
    const prev = squarePosition[index] - N / 2
    const next = positions[index] - N / 2
    const offset = 0

    const rrr =
      next >= prev
        ? /*
           * we are moving in -> or ^ i.e. changing the range[1]
           */
          [prev, next + i + offset]
        : /*
           * we are moving <- or v i.e. changing the range[0]
           */
          [next - offset, prev]

    const range = rrr.map((value) => clamp(value, 0, 120)) as [number, number]
    const target = next >= prev ? range[0] : range[1]

    assert(
      range[1] > range[0],
      `createMissingSquareOptions() unable to produce correct range: ${JSON.stringify(
        { prev, next, rrr, range, i, positions }
      )}`
    )

    return {
      range: range.map((value) => toPrecision(value)) as [number, number],
      target: toPrecision(target)
    }
  })

  return {
    lightness,
    chroma
  }
}

const cartesianToBarycentric = (p: Point, a: Point, b: Point, c: Point) => {
  const l0 =
    ((b[1] - c[1]) * (p[0] - c[0]) + (c[0] - b[0]) * (p[1] - c[1])) /
    ((b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]))
  const l1 =
    ((c[1] - a[1]) * (p[0] - c[0]) + (a[0] - c[0]) * (p[1] - c[1])) /
    ((b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]))
  return [l0, l1, 1.0 - l0 - l1]
}

export const selectorTriangle = once((store: Store) => {
  const squares = Array.from(selectorSquares(store, store.allIterations).keys())

  const pointsIndex: Map<number, Set<number>> = new Map()

  const add = (key: number, value: number) => {
    if (pointsIndex.has(key)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const set = pointsIndex.get(key)!
      set.add(value)
    } else {
      const set = new Set<number>()
      set.add(value)
      pointsIndex.set(key, set)
    }
  }

  squares.forEach((value) => {
    const i = store.options.interval
    const [x, y] = toPosition(value, i)

    add(szudzik2(x, y), value)
    add(szudzik2(x, y + i), value)
    add(szudzik2(x + i, y + i), value)
    add(szudzik2(x + i, y), value)
  })

  const points = Array.from(pointsIndex.keys()).map((value) =>
    unszudzik2(value)
  )

  const hull = convexHull(points).map((value) => ({ x: value[0], y: value[1] }))

  const result = minTriangle(hull, 10 ** -5, 0.1)

  if (result === null) {
    throw new Error('Unable to fit triangle')
  }

  const trianglePoints: Point[] = [
    [result.A.x, result.A.y],
    [result.B.x, result.B.y],
    [result.C.x, result.C.y]
  ]

  const A = sortBy(trianglePoints, (point) =>
    distance(...point, N / 2, N / 2)
  )[0]

  const B = sortBy(trianglePoints, (point) =>
    distance(...point, N / 2 + N / 2, N / 2 + N)
  )[0]

  const C = sortBy(trianglePoints, (point) =>
    distance(...point, N / 2 + N, N / 2)
  )[0]

  assert(A !== B, 'selectorTriangle() unable to produce correct triangle')
  assert(B !== C, 'selectorTriangle() unable to produce correct triangle')
  assert(C !== A, 'selectorTriangle() unable to produce correct triangle')

  const triangle: Triangle = [A, B, C]

  const tuple = range(0, N * 2, store.options.interval)

  const missingSquares = cartesianProduct(tuple, tuple)
    .map((value): number =>
      toSquare(value as [number, number], store.options.interval)
    )
    .filter((square) => {
      if (squares.includes(square)) {
        return false
      }

      const i = store.options.interval
      const [x, y] = toPosition(square, i)
      const points: Point[] = [
        [x, y],
        [x, y + i],
        [x + i, y + i],
        [x + i, y]
      ]

      return points.some((point) =>
        cartesianToBarycentric(point, ...triangle).every((value) => value > 0)
      )
    })

  const squareMap = new Map(
    missingSquares.map(
      (square) => [square, createMissingSquareOptions(store, square)] as const
    )
  )

  return {
    triangle,
    squares: squareMap
  }
})
