import type { Point, Triangle } from 'cepheus'

const cartesianToBarycentric = (p: Point, a: Point, b: Point, c: Point) => {
  const l0 =
    ((b[1] - c[1]) * (p[0] - c[0]) + (c[0] - b[0]) * (p[1] - c[1])) /
    ((b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]))
  const l1 =
    ((c[1] - a[1]) * (p[0] - c[0]) + (a[0] - c[0]) * (p[1] - c[1])) /
    ((b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]))
  return [l0, l1, 1 - l0 - l1]
}

export const isPointInsideTriangle = (point: Point, triangle: Triangle) =>
  cartesianToBarycentric(point, ...triangle).every((value) => value >= 0)
