import { to as convert, OKLCH, OKLrCH } from 'colorjs.io/fn'
import { sortBy } from 'lodash-es'
import assert from 'node:assert'
import { isColor } from '../utilities/is-color'
import { isSquareInsideTriangle } from '../utilities/is-square-inside-triangle'
import { toPrecision } from '../utilities/to-precision'
import type { Store } from './create-store'
import { selectorSquares } from './selector-squares'
import { selectorTriangles } from './selector-triangles'
import type { RawPalette } from 'cepheus'

export const selectorPalette = (store: Store): RawPalette => {
  const { colorGamut, interval, precision } = store.options
  const { length } = store.options.colors

  const triangles = selectorTriangles(store)

  const values = sortBy(
    Array.from(selectorSquares(store, true).entries())
      .filter(([square]) =>
        triangles.some((triangle) => isSquareInsideTriangle(square, interval, triangle)),
      )
      .map(([square, task]): [number, Array<[number, number, number] | null>] => [
        square,
        task.state.colors.map((coords) => {
          if (coords === null) {
            return null
          }

          const value =
            store.options.colorSpace === 'oklch'
              ? coords
              : convert({ alpha: 1, coords, space: OKLrCH }, OKLCH).coords

          assert(isColor(value))

          return value.map((value) => toPrecision(value, precision)) as [number, number, number]
        }),
      ]),
    ([key]) => key,
  )

  const squares = values.map(([key]) => key)
  const colors = values
    .map(([_, value]) => value)
    .flat(2)
    .map((value) => value)

  const triangleFlat = triangles.flat(2) // .map((value) => toPrecision(value, store.options.precision))

  return [colorGamut, interval, length, triangleFlat, squares, colors]
}
