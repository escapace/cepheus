import type { Point } from 'cepheus'

interface Options {
  sorted?: boolean
}
/**
 * Computes the convex hull of a binary image using Andrew's Monotone Chain Algorithm
 * http://www.algorithmist.com/index.php/Monotone_Chain_Convex_Hull
 *
 * @param values - An array of points.
 * @param options - MCCH Algorithm options.
 * @return Coordinates of the convex hull in clockwise order
 */
export function convexHull(points: Point[], options: Options = {}): Point[] {
  const values =
    options.sorted === true ? points : points.slice().sort(byXThenY)

  const n = values.length
  const result = new Array(n * 2) as Point[]
  let k = 0

  for (let index = 0; index < n; index++) {
    const point = values[index]
    while (k >= 2 && cw(result[k - 2], result[k - 1], point) <= 0) {
      k--
    }
    result[k++] = point
  }

  const t = k + 1
  for (let index = n - 2; index >= 0; index--) {
    const point = values[index]
    while (k >= t && cw(result[k - 2], result[k - 1], point) <= 0) {
      k--
    }
    result[k++] = point
  }

  return result.slice(0, k - 1)
}

function cw(p1: Point, p2: Point, p3: Point) {
  return (p2[1] - p1[1]) * (p3[0] - p1[0]) - (p2[0] - p1[0]) * (p3[1] - p1[1])
}

function byXThenY(point1: Point, point2: Point) {
  if (point1[0] === point2[0]) {
    return point1[1] - point2[1]
  }
  return point1[0] - point2[0]
}
