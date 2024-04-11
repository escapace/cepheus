/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Line, Point, State, Triangle } from '../types'
import { intersection } from './intersection'
import { lerpArray } from './lerp-array'

export const lightness1 = (
  p0: Point,
  p1: Point,
  state: Pick<State, 'lightness'>
) => lerpArray(p0, p1, state.lightness[1]) as Point
export const lightness0 = (
  p0: Point,
  p1: Point,
  state: Pick<State, 'lightness'>
) => lerpArray(p1, p0, 1 - state.lightness[0]) as Point
export const chroma1 = (x0: Point, v1: Point, state: Pick<State, 'chroma'>) =>
  lerpArray(x0, v1, state.chroma[1]) as Point

export const chroma0 = (
  x0: Point,
  triangle: Triangle,
  state: Pick<State, 'chroma'>
) => {
  const x1 = lerpArray(x0, triangle[1], state.chroma[0]) as Point

  let p0: Point
  let p1: Point

  const delta = x1[1] - x0[1]

  if (delta === 0) {
    p0 = triangle[0]
    p1 = triangle[2]
  } else {
    const ab = [triangle[0], triangle[2]].map(
      (point): Point => [point[0], point[1] + delta]
    ) as Line

    // can this break?
    p0 = intersection(ab, [triangle[0], triangle[1]])!
    p1 = intersection(ab, [triangle[1], triangle[2]])!
  }

  return { p0, p1 }
}

export const getX0 = (triangle: Triangle) => {
  // const x0 = intersection([v0, v2], [v1, [v1[0], 0]]) as Point
  const x0 = intersection(
    [triangle[0], triangle[2]],
    [triangle[1], [triangle[1][0], 0]]
  )!
  // const x0: Point = [
  //   (triangle[0][0] + triangle[2][0]) / 2,
  //   (triangle[0][1] + triangle[2][1]) / 2
  // ]

  return x0
}
