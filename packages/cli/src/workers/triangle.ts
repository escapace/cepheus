import { N, szudzik2 } from '@cepheus/utilities'
import {
  Pixel,
  Triangle,
  TriangleTaskOptions,
  TriangleTaskResult
} from '../types'
import { distance } from '../utilities/distance'
import {
  TRIANGLE_CANVAS_HEIGHT,
  TRIANGLE_CANVAS_WIDTH
} from '../utilities/triangle'

function lerp(v0: number, v1: number, t: number) {
  return v0 * (1 - t) + v1 * t
}

export const triangle = async (
  options: TriangleTaskOptions
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<TriangleTaskResult> => {
  const triangles = options.triangles
  const pixels = new Set(options.pixels)
  let bestArea = 0
  let best: Triangle | undefined

  const isLine = (A: Pixel, B: Pixel): false | number => {
    for (let t = 0; t <= 1; t += 0.025) {
      if (
        !pixels.has(
          szudzik2(
            Math.round(lerp(A[0], B[0], t)),
            Math.round(lerp(A[1], B[1], t))
          )
        )
      ) {
        return false
      }
    }

    return distance(...A, ...B)
  }

  for (const [axy, bxy, cxy] of triangles) {
    const dAB = isLine(axy, bxy)
    const dBC = isLine(bxy, cxy)
    const dCA = isLine(cxy, axy)

    if (dAB !== false && dBC !== false && dCA !== false) {
      const s = (dAB + dBC + dCA) / 2
      const area = Math.sqrt(s * (s - dAB) * (s - dBC) * (s - dCA))

      if (area > bestArea) {
        bestArea = area
        best = [axy, bxy, cxy]
      }
    }
  }

  return best === undefined
    ? undefined
    : [
        best.map(([x, y]) => [
          (N * x) / TRIANGLE_CANVAS_WIDTH,
          (N * y) / TRIANGLE_CANVAS_HEIGHT
        ]) as Triangle,
        bestArea
      ]
}
