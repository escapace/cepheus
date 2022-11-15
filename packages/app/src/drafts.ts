import {
  N,
  szudzik2,
  toPosition,
  toSquare,
  type Model
} from '@cepheus/utilities'

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

function lerp(v0: number, v1: number, t: number) {
  return v0 * (1 - t) + v1 * t
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

const normalize = (values: number[]) => {
  const s = sum(values)

  return values.map((value) => value / s)
}

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

export const neighbours = (square: number, interval: number): number[] => {
  const [xs, ys] = toPosition(square, interval)
  const i = interval

  const n = [xs, ys + i]
  const e = [xs + i, ys]
  const s = [xs, ys - i]
  const w = [xs - i, ys]

  const ne = [xs + i, ys + i]
  const se = [xs + i, ys - i]
  const sw = [xs - i, ys - i]
  const nw = [xs - i, ys + i]

  return [n, ne, e, se, s, sw, w, nw]
    .filter(([x, y]) => x >= 0 && y >= 0 && x < N && y < N)
    .map((position) => toSquare(position as [number, number], i))
}

export const fromModel = (model: Model) => {
  const [interval, length, squares, data] = model
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

  const maxDistance = interval / 2

  const toWeight = (x: number, y: number, sx: number, sy: number) =>
    erfc(distanceF(x, y, sx + interval / 2, sy + interval / 2) / maxDistance)

  const get = (
    xp: number,
    yp: number,
    colorIndex: number,
    extend = true
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

    ;(
      [
        [sx, sy + interval],
        [sx + interval, sy],
        [sx, sy - interval],
        [sx - interval, sy],
        [sx + interval, sy + interval],
        [sx + interval, sy - interval],
        [sx - interval, sy - interval],
        [sx - interval, sy + interval]
      ] as Array<[number, number]>
    ).forEach(([sx, sy]) => {
      if (sx >= 0 && sy >= 0 && sx < N && sy < N) {
        const square = szudzik2(sx / interval, sy / interval)

        const color = colors.get(square)?.[colorIndex]

        if (color !== undefined) {
          weights.push(toWeight(x, y, sx, sy))
          values.push(color)
        }
      }

      return undefined
    })

    if (values.length === 0) {
      return undefined
    }

    const nWeights = normalize(weights)

    return values.reduce((prev, next, index) => {
      const [a, b] = adjust(prev[2], next[2])

      return [
        lerp(prev[0], next[0], nWeights[index]),
        lerp(prev[1], next[1], nWeights[index]),
        lerp(a, b, nWeights[index])
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
    //     nWeights[index]
    //   ) as [number, number, number]
    // })
  }

  return { interval, length, squares, colors, get }
}
