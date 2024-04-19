import { assert } from './assert'
import {
  ColorSpace,
  type Model,
  type ModelUnparsed,
  type Point,
  type Triangle
} from './types'
import { chunk } from './utilities/chunk'

export const parse = (model: unknown): Model => {
  assert(Array.isArray(model))
  assert(model.length === 6)

  const [colorSpaceIndex, interval, length, triangleFlat, squares, data] =
    model as ModelUnparsed

  assert(typeof colorSpaceIndex === 'number')
  assert(colorSpaceIndex === 1 || colorSpaceIndex === 2)
  assert(typeof interval === 'number')
  assert(typeof length === 'number')
  assert(Array.isArray(triangleFlat))
  assert(triangleFlat.length === 6)
  assert(Array.isArray(squares))
  assert(Array.isArray(data))

  const triangle: Triangle = [
    triangleFlat.slice(0, 2) as Point,
    triangleFlat.slice(2, 4) as Point,
    triangleFlat.slice(4, 6) as Point
  ]

  const step = length * 3

  const colors = new Map(
    squares.map((square, index) => [
      square,
      chunk(data.slice(index * step, (index + 1) * step)) as Array<
        [number, number, number]
      >
    ])
  )

  const colorSpace = colorSpaceIndex === 1 ? ColorSpace.p3 : ColorSpace.srgb

  return {
    colors,
    colorSpace,
    interval,
    length,
    squares,
    triangle
  }
}
