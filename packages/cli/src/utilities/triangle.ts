import { N, szudzik2 } from '@cepheus/utilities'
import cartesianProduct from 'big-cartesian'
import { orderBy, uniqWith } from 'lodash-es'
import { mean } from 'simple-statistics'
import { Pixel, Triangle, TriangleOptions } from '../types'
import { distance } from './distance'

// export const TRIANGLE_CANVAS_HEIGHT = 64 + 64
// export const TRIANGLE_CANVAS_WIDTH = 64 + 64
export const TRIANGLE_CANVAS_HEIGHT = 320
export const TRIANGLE_CANVAS_WIDTH = 320
export const TRIANGLE_TASK_BATCH_SIZE = 100000

const CORNER_RATIO_A = 5 / 100
const CORNER_RATIO_B = 10 / 100
const CORNER_RATIO_C = 5 / 100

const isPixel = (
  interval: number,
  squares: number[],
  _x: number,
  _y: number,
  extend: boolean
): boolean => {
  const xp = (100 * _x) / TRIANGLE_CANVAS_WIDTH
  const yp = (100 * _y) / TRIANGLE_CANVAS_HEIGHT

  const x = (N / 100) * xp
  const y = (N / 100) * yp

  const nXf = Math.floor(x / interval)
  const nYf = Math.floor(y / interval)

  const square = szudzik2(nXf, nYf)

  const sx = nXf * interval
  const sy = nYf * interval

  // const base = colors.get(square)?.[colorIndex]
  const base = squares.includes(square)

  if (!base && !extend) {
    return false
  }

  const n = [sx, sy + interval]
  const e = [sx + interval, sy]
  const s = [sx, sy - interval]
  const w = [sx - interval, sy]
  const ne = [sx + interval, sy + interval]
  const se = [sx + interval, sy - interval]
  const sw = [sx - interval, sy - interval]
  const nw = [sx - interval, sy + interval]

  return [e, n, ne, nw, s, se, sw, w].some(([sx, sy]) => {
    if (sx >= 0 && sy >= 0 && sx < N && sy < N) {
      const square = szudzik2(sx / interval, sy / interval)
      return squares.includes(square)
    }

    return false
  })
}

const edgeDetection = (interval: number, squares: number[]) => {
  const pixels: Array<[number, number]> = []

  // up to down
  for (let x = 0; x < TRIANGLE_CANVAS_WIDTH; x++) {
    for (let y = 0; y < TRIANGLE_CANVAS_HEIGHT; y++) {
      if (isPixel(interval, squares, x, y, true)) {
        pixels.push([x, y])

        break
      }
    }
  }

  // right to left
  for (let y = 0; y < TRIANGLE_CANVAS_HEIGHT; y++) {
    for (let x = 0; x < TRIANGLE_CANVAS_WIDTH; x++) {
      if (isPixel(interval, squares, x, y, true)) {
        pixels.push([x, y])

        break
      }
    }
  }

  // down to up
  for (let x = TRIANGLE_CANVAS_WIDTH - 1; x >= 0; x--) {
    for (let y = TRIANGLE_CANVAS_HEIGHT - 1; y >= 0; y--) {
      if (isPixel(interval, squares, x, y, true)) {
        pixels.push([x, y])

        break
      }
    }
  }

  // left to right
  for (let y = TRIANGLE_CANVAS_HEIGHT - 1; y >= 0; y--) {
    for (let x = TRIANGLE_CANVAS_WIDTH - 1; x >= 0; x--) {
      if (isPixel(interval, squares, x, y, true)) {
        pixels.push([x, y])

        break
      }
    }
  }

  return uniqWith(pixels, (a, b) => a[0] === b[0] && a[1] === b[1])
}

const cornerDetection = (
  edges: Array<[number, number]>
): [[number, number], [number, number], [number, number]] => {
  const cornerA = orderBy(edges, ([x, y]) => distance(x, y, 0, 0), 'asc')[0]
  const cornerC = orderBy(
    edges,
    ([x, y]) => distance(x, y, TRIANGLE_CANVAS_HEIGHT, 0),
    'asc'
  )[0]

  const cornerB = orderBy(
    edges,
    ([x, y]) =>
      mean([
        distance(x, y, cornerA[0], cornerA[1]),
        distance(x, y, cornerC[0], cornerC[1])
      ]),
    'desc'
  )[0]

  return [cornerA, cornerB, cornerC]
}

export const createTriangleOptions = (
  interval: number,
  squares: number[]
): TriangleOptions => {
  const edges = edgeDetection(interval, squares)
  const corners = cornerDetection(edges)
  const factorA: Pixel[] = []
  const factorB: Pixel[] = []
  const factorC: Pixel[] = []

  const meanD = mean([TRIANGLE_CANVAS_WIDTH, TRIANGLE_CANVAS_HEIGHT])

  const maxDistanceA = meanD * CORNER_RATIO_A
  const maxDistanceB = meanD * CORNER_RATIO_B
  const maxDistanceC = meanD * CORNER_RATIO_C

  const pixels: number[] = []

  for (let x = 0; x < TRIANGLE_CANVAS_WIDTH; x++) {
    for (let y = 0; y < TRIANGLE_CANVAS_HEIGHT; y++) {
      if (isPixel(interval, squares, x, y, true)) {
        const pixel = szudzik2(x, y)

        if (!pixels.includes(pixel)) {
          pixels.push(pixel)
        }

        if (distance(x, y, corners[0][0], corners[0][1]) <= maxDistanceA) {
          factorA.push([x, y])
        } else if (
          distance(x, y, corners[1][0], corners[1][1]) <= maxDistanceB
        ) {
          factorB.push([x, y])
        } else if (
          distance(x, y, corners[2][0], corners[2][1]) <= maxDistanceC
        ) {
          factorC.push([x, y])
        }
      }
    }
  }

  return { factors: [factorA, factorB, factorC], pixels }
}

export function* createTriangleTaskIterator(
  factors: [Pixel[], Pixel[], Pixel[]]
) {
  const iterable = cartesianProduct(factors)

  let triangles: Triangle[] = []

  for (const item of iterable) {
    triangles.push(item)

    if (triangles.length >= TRIANGLE_TASK_BATCH_SIZE) {
      yield triangles

      triangles = []
    }
  }

  if (triangles.length !== 0) {
    yield triangles
  }
}
