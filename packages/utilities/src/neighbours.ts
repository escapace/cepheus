import { N } from './constants'
import { toPosition } from './to-position'
import { toSquare } from './to-square'

export const neighbours = (
  square: number,
  interval: number,
  intercardinal: boolean
): number[] => {
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

  return (intercardinal ? [n, ne, e, se, s, sw, w, nw] : [n, e, s, w])
    .filter(([x, y]) => x >= 0 && y >= 0 && x < N && y < N)
    .map((position) => toSquare(position as [number, number], i))
}
