import { N, szudzik2, type Model } from '@cepheus/utilities'

export function constrain(angle: number) {
  return ((angle % 360) + 360) % 360
}

export function adjust(a: number, b: number) {
  let [a1, a2] = [a, b].map(constrain)

  const angleDiff = a2 - a1

  if (angleDiff > 180) {
    a1 += 360
  } else if (angleDiff < -180) {
    a2 += 360
  }

  return [a1, a2]
}

const chunk = <T>(array: T[], n = 3) =>
  array.reduce<T[][]>((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / n)

    if (resultArray[chunkIndex] === undefined) {
      resultArray[chunkIndex] = [] // start a new chunk
    }

    resultArray[chunkIndex].push(item)

    return resultArray
  }, [])

const distanceF = (px: number, py: number, qx = 0, qy = 0) =>
  Math.abs(px - qx) + Math.abs(py - qy)

// const distanceF = (px: number, py: number, qx = 0, qy = 0) =>
//   Math.hypot(px - qx, py - qy)

function lerp(v0: number, v1: number, t: number) {
  return v0 * (1 - t) + v1 * t
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

const normalize = (values: number[]) => {
  const s = sum(values)

  return values.map((value) => value / s)
}

// function erf(x: number) {
//     const t = 1 / (1 + 0.5 * Math.abs(x));
//     const tau =
//         t *
//         Math.exp(
//             -x * x +
//                 ((((((((0.17087277 * t - 0.82215223) * t + 1.48851587) * t -
//                     1.13520398) *
//                     t +
//                     0.27886807) *
//                     t -
//                     0.18628806) *
//                     t +
//                     0.09678418) *
//                     t +
//                     0.37409196) *
//                     t +
//                     1.00002368) *
//                     t -
//                 1.26551223
//         );
//     if (x >= 0) {
//         return 1 - tau;
//     } else {
//         return tau - 1;
//     }
// }

export function erfc(x: number): number {
  const z = Math.abs(x)
  const t = 1 / (1 + z / 2)
  // prettier-ignore
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 +
          t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 +
          t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
          t * (-0.82215223 + t * 0.17087277)))))))));

  return x >= 0 ? r : 2 - r
}

export const fromModel = (model: Model) => {
  const [interval, length, triangle, squares, data] = model
  const step = length * 3

  const colors = new Map(
    squares.map((square, index) => {
      return [
        square,
        chunk(data.slice(index * step, (index + 1) * step)) as Array<
          [number, number, number]
        >
      ]
    })
  )

  const maxDistance = interval

  const toWeight = (x: number, y: number, sx: number, sy: number) =>
    erfc(distanceF(x, y, sx + interval / 2, sy + interval / 2) / maxDistance)

  const get = (
    xp: number,
    yp: number,
    colorIndex: number,
    extend = false
  ): [number, number, number] | undefined => {
    const x = (N / 100) * xp
    const y = (N / 100) * yp

    const nXf = Math.floor(x / interval)
    const nYf = Math.floor(y / interval)

    const square = szudzik2(nXf, nYf)

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
        const square = szudzik2(sx / interval, sy / interval)
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
      const [a, b] = adjust(prev[2], next[2])

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

  return { interval, length, squares, colors, get, triangle }
}
