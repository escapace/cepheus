/* eslint-disable unicorn/prevent-abbreviations */
import { LENGTH as N } from 'cepheus'
import { toPosition } from './to-position'
import { toSquare } from './to-square'

export const neighbours = (
  square: number,
  interval: number,
  intercardinal: boolean
): number[] => {
  const [xs, ys] = toPosition(square, interval)
  const index = interval

  const n = [xs, ys + index]
  const e = [xs + index, ys]
  const s = [xs, ys - index]
  const w = [xs - index, ys]

  const ne = [xs + index, ys + index]
  const se = [xs + index, ys - index]
  const sw = [xs - index, ys - index]
  const nw = [xs - index, ys + index]

  return (intercardinal ? [n, ne, e, se, s, sw, w, nw] : [n, e, s, w])
    .filter(([x, y]) => x >= 0 && y >= 0 && x < N * 2 && y < N * 2)
    .map((position) => toSquare(position as [number, number], index))
}
