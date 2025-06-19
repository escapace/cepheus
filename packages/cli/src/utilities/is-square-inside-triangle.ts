import { toPosition } from '@cepheus/utilities'
import type { Point, Triangle } from 'cepheus'
import { isPointInsideTriangle } from './is-point-inside-triangle'

export const isSquareInsideTriangle = (square: number, interval: number, triangle: Triangle) => {
  const [x, y] = toPosition(square, interval)
  const points: Point[] = [
    [x, y],
    [x, y + interval],
    [x + interval, y + interval],
    [x + interval, y],
  ]

  return points.some((point) => isPointInsideTriangle(point, triangle))
}
