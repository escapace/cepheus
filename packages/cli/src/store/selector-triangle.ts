import { tile, toPosition } from '@cepheus/utilities'
import type { Point, Triangle } from 'cepheus'
import { once } from 'lodash-es'
import { createMinimumPerimeterTriangle } from '../utilities/create-minimum-perimeter-triangle'
import type { Store } from './create-store'
import { selectorSquares } from './selector-squares'
import { createSquareOptions } from './create-square-options'

const cartesianToBarycentric = (p: Point, a: Point, b: Point, c: Point) => {
  const l0 =
    ((b[1] - c[1]) * (p[0] - c[0]) + (c[0] - b[0]) * (p[1] - c[1])) /
    ((b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]))
  const l1 =
    ((c[1] - a[1]) * (p[0] - c[0]) + (a[0] - c[0]) * (p[1] - c[1])) /
    ((b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]))
  return [l0, l1, 1 - l0 - l1]
}

const isInsideTriangle = (point: Point, triangle: Triangle) =>
  cartesianToBarycentric(point, ...triangle).every((value) => value >= 0)

export const selectorTriangle = once((store: Store) => {
  const { interval } = store.options
  const squares = Array.from(selectorSquares(store, store.allIterations).keys())

  const triangle = createMinimumPerimeterTriangle(squares, interval)

  const missingSquares = tile(interval).filter((square) => {
    if (squares.includes(square)) {
      return false
    }

    const [x, y] = toPosition(square, interval)
    const points: Point[] = [
      [x, y],
      [x, y + interval],
      [x + interval, y + interval],
      [x + interval, y],
    ]

    return points.some((point) => isInsideTriangle(point, triangle))
  })

  const squareMap = new Map(
    missingSquares.map((square) => [square, createSquareOptions(square, interval)] as const),
  )

  return {
    squares: squareMap,
    triangle,
  }
})
