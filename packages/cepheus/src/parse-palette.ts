import { DirectAddressTable, mapChunkBy } from 'coastal'
import { chunk } from 'es-toolkit'
import { assert } from './assert'
import type { Palette, RawPalette, Triangle } from './types'

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

  const coordinates = chunk(
    mapChunkBy(
      data,
      (value) => (value === null ? 1 : 3),
      (value) => (value.length === 1 ? undefined : (value as [number, number, number])),
    ),
    length,
  )

  const colors = new DirectAddressTable(squares, coordinates)

  return {
    colorGamut,
    colors,
    interval,
    length,
    squares,
    triangles,
  }
}
