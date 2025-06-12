import { assert } from './assert'
import type { Palette, RawPalette, Point, Triangle } from './types'
import { chunk } from './utilities/chunk'

export const parsePalette = (palette: unknown): Palette => {
  assert(Array.isArray(palette))
  assert(palette.length === 6)

  const [colorGamut, interval, length, triangleFlat, squares, data] = palette as RawPalette

  assert(typeof colorGamut === 'string')
  assert(colorGamut === 'p3' || colorGamut === 'srgb')
  assert(typeof interval === 'number')
  assert(typeof length === 'number')
  assert(Array.isArray(triangleFlat))
  assert(triangleFlat.length === 6)
  assert(Array.isArray(squares))
  assert(Array.isArray(data))

  const triangle: Triangle = [
    triangleFlat.slice(0, 2) as Point,
    triangleFlat.slice(2, 4) as Point,
    triangleFlat.slice(4, 6) as Point,
  ]

  const step = length * 3

  const colors = new Map(
    squares.map((square, index) => [
      square,
      chunk(data.slice(index * step, (index + 1) * step)) as Array<[number, number, number]>,
    ]),
  )

  return {
    colorGamut,
    colors,
    interval,
    length,
    squares,
    triangle,
  }
}
