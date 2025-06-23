import type { RawPalette } from 'cepheus'
import { to as convert, OKLCH, OKLrCH } from 'colorjs.io/fn'
import { fixNaN } from '../utilities/fix-nan'
import { isSquareInsideTriangle } from '../utilities/is-square-inside-triangle'
import { toPrecision } from '../utilities/to-precision'
import type { Store } from './create-store'
import { selectorSquares } from './selector-squares'
import { selectorTriangles } from './selector-triangles'

export const selectorPalette = (store: Store): RawPalette => {
  const { colorGamut, interval, precision } = store.options
  const { length } = store.options.colors

  const triangles = selectorTriangles(store)

  const values = new Map(
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
              : // TODO: remove fixNaN
                fixNaN(convert({ alpha: 1, coords, space: OKLrCH }, OKLCH).coords)

          return value.map((value) => toPrecision(value, precision)) as [number, number, number]
        }),
      ]),
  )

  const squares = Array.from(values.keys())
  const colors = Array.from(values.values())
    .flat(2)
    .map((value) => value ?? 2)

  const triangleFlat = triangles.flat(2).map((value) => toPrecision(value, store.options.precision))

  return [colorGamut, interval, length, triangleFlat, squares, colors]
}
