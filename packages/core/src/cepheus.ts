import { adjustAngle } from './adjust-angle'
import { LENGTH as N } from './constants'
import { distance } from './distance'
import { erfc } from './erfc'
import { intersection } from './intersection'
import { lerp } from './lerp'
import { lerpArray } from './lerp-array'
import { normalize } from './normalize'
import { szudzik } from './szudzik'
import type { State, Line, Model, Point, Triangle } from './types'

export const cepheus = (model: Model, initialState?: State) => {
  const { interval, colors } = model

  const [v0, v1, v2] = model.triangle
  const x0 = intersection([v0, v2], [v1, [v1[0], 0]]) as Point

  const state: State = initialState ?? { lightness: [0, 1], chroma: [0, 1] }

  let p0: Point
  let p1: Point
  let t0: Point
  let t1: Point
  let t2: Point

  const lightness1 = () => {
    t2 = lerpArray(p0, p1, state.lightness[1]) as Point
  }

  const lightness0 = () => {
    t0 = lerpArray(p1, p0, 1 - state.lightness[0]) as Point
  }

  const chroma1 = () => {
    t1 = lerpArray(x0, v1, state.chroma[1]) as Point
  }

  const chroma0 = (): void => {
    const x1 = lerpArray(x0, v1, state.chroma[0]) as Point

    const delta = x1[1] - x0[1]

    const ab = [v0, v2].map(
      (point): Point => [point[0], point[1] + delta]
    ) as Line

    // can this break?
    p0 = intersection(ab, [v0, v1]) as Point
    p1 = intersection(ab, [v1, v2]) as Point

    lightness0()
    lightness1()
  }

  const toWeight = (x: number, y: number, sx: number, sy: number) =>
    erfc(distance(x, y, sx + interval / 2, sy + interval / 2) / interval)

  const cartesian = (
    x: number,
    y: number,
    colorIndex: number,
    extend = false
  ): [number, number, number] | undefined => {
    const nXf = Math.floor(x / interval)
    const nYf = Math.floor(y / interval)

    const square = szudzik(nXf, nYf)

    const sx = nXf * interval
    const sy = nYf * interval

    const base = colors.get(square)?.[colorIndex]

    const weights: number[] = []
    const values: Array<[number, number, number]> = []

    if (base !== undefined) {
      weights.push(toWeight(x, y, sx, sy))
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
      if (sx >= 0 && sy >= 0 && sx < N && sy < N) {
        const square = szudzik(sx / interval, sy / interval)
        const color = colors.get(square)?.[colorIndex]

        if (color !== undefined) {
          weights.push(toWeight(x, y, sx, sy) * 2)
          values.push(color)
        }
      }

      return undefined
    })

    if (values.length === 0) {
      return undefined
    }

    const normalizedWeights = normalize(weights)

    return values.reduce((prev, next, index) => {
      const [a, b] = adjustAngle(prev[2], next[2])

      return [
        lerp(prev[0], next[0], normalizedWeights[index]),
        lerp(prev[1], next[1], normalizedWeights[index]),
        lerp(a, b, normalizedWeights[index])
      ]
    })

    // return values.reduce((prev, next, index) => {
    //   const [a, b] = adjust(prev[2], next[2])
    //
    //   return getCatmullRomPoint(
    //     {
    //       points: [
    //         [prev[0], prev[1], a],
    //         [next[0], next[1], b]
    //       ],
    //       tension: 0.5,
    //       closed: false,
    //       type: 'catmullrom'
    //     },
    //     normalizedWeights[index]
    //   ) as [number, number, number]
    // })
  }

  const barycentric = (
    alpha: number,
    beta: number,
    gamma: number,
    colorIndex: number
  ) => {
    const x = alpha * t0[0] + beta * t1[0] + gamma * t2[0]
    const y = alpha * t0[1] + beta * t1[1] + gamma * t2[1]

    return cartesian(x, y, colorIndex, true)
  }

  chroma0()
  chroma1()

  return {
    cartesian,
    barycentric,
    updateLightness: (value: [number, number]) => {
      if (value[0] !== state.lightness[0]) {
        state.lightness[0] = value[0]
        lightness0()
      }

      if (value[1] !== state.lightness[1]) {
        state.lightness[1] = value[1]
        lightness1()
      }
    },

    updateChroma: (value: [number, number]) => {
      if (value[0] !== state.chroma[0]) {
        state.chroma[0] = value[0]
        chroma0()
      }

      if (value[1] !== state.chroma[1]) {
        state.chroma[1] = value[1]
        chroma1()
      }
    },
    triangle: (): Readonly<Triangle> => [t0, t1, t2],
    lightness: (): Readonly<State['lightness']> => state.lightness,
    chroma: (): Readonly<State['chroma']> => state.chroma
  }
}

// export const constrainFactory = (triangle: Triangle) => {
//   const [v0, v1, v2] = triangle
//
//   const x0 = intersection([v0, v2], [v1, [v1[0], 0]])
//
//   if (x0 === undefined) {
//     return undefined
//   }
//
//   return (
//     lightness: [number, number],
//     chroma: [number, number]
//   ): Triangle | undefined => {
//     const t1 = lerpValues(x0, v1, chroma[1]) as Point
//     const x1 = lerpValues(x0, v1, chroma[0]) as Point
//
//     const delta = x1[1] - x0[1]
//
//     const ab = [v0, v2].map(
//       (point): Point => [point[0], point[1] + delta]
//     ) as Line
//
//     const p0 = intersection(ab, [v0, v1])
//     const p2 = intersection(ab, [v1, v2])
//
//     if (p0 === undefined || p2 === undefined) {
//       return undefined
//     }
//
//     const t0 = lerpValues(p0, p2, lightness[1]) as Point
//     const t2 = lerpValues(p2, p0, 1 - lightness[0]) as Point
//
//     return [t0, t1, t2]
//   }
// }

// export const constrainFactory = (triangle: Triangle) => {
//   const [v0, v1, v2] = triangle
//
//   const x0 = intersection([v0, v2], [v1, [v1[0], 0]])
//
//   if (x0 === undefined) {
//     return undefined
//   }
//
//   const updateChromaLow = (
//     value: number
//   ): [p0: Point, p1: Point] | undefined => {
//     const x1 = lerpArray(x0, v1, value) as Point
//
//     const delta = x1[1] - x0[1]
//
//     const ab = [v0, v2].map(
//       (point): Point => [point[0], point[1] + delta]
//     ) as Line
//
//     const p0 = intersection(ab, [v0, v1])
//     const p1 = intersection(ab, [v1, v2])
//
//     if (p0 === undefined || p1 === undefined) {
//       return undefined
//     }
//
//     return [p0, p1]
//   }
//
//   return (
//     lightness: [number, number],
//     chroma: [number, number]
//   ): Triangle | undefined => {
//     const values = updateChromaLow(chroma[0])
//
//     if (values === undefined) {
//       return undefined
//     }
//
//     const [p0, p1] = values
//
//     const t0 = lerpArray(p0, p1, lightness[1]) as Point
//     const t1 = lerpArray(x0, v1, chroma[1]) as Point
//     const t2 = lerpArray(p1, p0, 1 - lightness[0]) as Point
//
//     return [t0, t1, t2]
//   }
// }