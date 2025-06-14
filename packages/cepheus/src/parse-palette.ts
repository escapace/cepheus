import { assert } from './assert'
import type { Palette, RawPalette, Triangle } from './types'
import { chunk } from './utilities/chunk'

export const parsePalette = (palette: unknown): Palette => {
  assert(Array.isArray(palette))
  assert(palette.length === 6)

  const [colorGamut, interval, length, trianglesFlat, squares, data] = palette as RawPalette

  assert(typeof colorGamut === 'string')
  assert(colorGamut === 'p3' || colorGamut === 'srgb')
  assert(typeof interval === 'number')
  assert(typeof length === 'number')
  assert(Array.isArray(trianglesFlat))
  assert(Array.isArray(squares))
  assert(Array.isArray(data))

  const triangles = chunk(chunk(trianglesFlat, 2), 3) as Triangle[]

  assert(triangles.length >= 1)

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
    triangles
  }
}
