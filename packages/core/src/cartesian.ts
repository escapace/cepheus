import { INTERPOLATOR, LENGTH as N } from './constants'
import { Interpolator } from './types'
import { distance } from './utilities/distance'
import { erfc } from './utilities/erfc'
import { lerp } from './utilities/lerp'
import { lerpAngle } from './utilities/lerp-angle'
import { normalize } from './utilities/normalize'
import { szudzik } from './utilities/szudzik'

const toWeight = (
  x: number,
  y: number,
  sx: number,
  sy: number,
  interval: number
) => erfc(distance(x, y, sx + interval / 2, sy + interval / 2) / interval)

export const cartesian = (
  interpolator: Interpolator,
  color: number,
  x: number,
  y: number,
  extend = true
): [number, number, number] | undefined => {
  const { interval, colors } = interpolator[INTERPOLATOR].model

  const nXf = Math.floor(x / interval)
  const nYf = Math.floor(y / interval)

  const square = szudzik(nXf, nYf)

  const sx = nXf * interval
  const sy = nYf * interval

  const base = colors.get(square)?.[color]

  const weights: number[] = []
  const values: Array<[number, number, number]> = []

  if (base !== undefined) {
    weights.push(toWeight(x, y, sx, sy, interval))
    values.push(base)
  } else if (!extend) {
    return undefined
  }

  const n = [sx, sy + interval]
  const e = [sx + interval, sy]
  const s = [sx, sy - interval]
  const w = [sx - interval, sy]
  const ne = [sx + interval, sy + interval]
  const se = [sx + interval, sy - interval]
  const sw = [sx - interval, sy - interval]
  const nw = [sx - interval, sy + interval]

  // prettier-ignore
  const order = [
    // long walk
    //
    // n, s, ne, sw, e, nw, se, w // !
    // s, ne, sw, n, se, nw, e, w // !
    // n, se, nw, s, ne, sw, e, w // !
    // s, n, se, nw, e, sw, ne, w // !
    // n, sw, ne, s, nw, se, w, e // !
    // s, nw, se, n, sw, ne, w, e // !
    // n, s, nw, se, w, ne, sw, e // !
    s, n, sw, ne, w, se, nw, e // !
    // e, nw, se, w, ne, sw, n, s
    // w, ne, sw, e, nw, se, n, s
    // w, e, nw, se, n, sw, ne, s
    // e, w, ne, sw, n, se, nw, s
    // e, w, se, nw, s, ne, sw, n
    // w, e, sw, ne, s, nw, se, n
    // w, se, nw, e, sw, ne, s, n
    // e, sw, ne, w, se, nw, s, n
  ]

  order.forEach(([sx, sy]) => {
    if (sx >= 0 && sy >= 0 && sx < N * 2 && sy < N * 2) {
      const square = szudzik(sx / interval, sy / interval)
      const coords = colors.get(square)?.[color]

      if (coords !== undefined) {
        weights.push(toWeight(x, y, sx, sy, interval) * 2)
        values.push(coords)
      }
    }

    return undefined
  })

  if (values.length === 0) {
    return undefined
  }

  const normalizedWeights = normalize(weights)

  return values.reduce((prev, next, index) => [
    lerp(prev[0], next[0], normalizedWeights[index]),
    lerp(prev[1], next[1], normalizedWeights[index]),
    lerpAngle(prev[2], next[2], normalizedWeights[index])
  ])
}
