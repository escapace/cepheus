import type { RawPalette } from 'cepheus'
import { to as convert, OKLCH, OKLrCH } from 'colorjs.io/fn'
import { flattenDeep, map } from 'lodash-es'
import { fixNaN } from '../utilities/fix-nan'
import { toPrecision } from '../utilities/to-precision'
import type { Store } from './create-store'
import { selectorSquares } from './selector-squares'
import { selectorTriangle } from './selector-triangle'

export const selectorPalette = (store: Store): RawPalette => {
  const gamut = store.options.colorGamut
  const interval = store.options.interval
  const length = store.options.colors.length

  const triangle = selectorTriangle(store)

  const values = new Map(
    Array.from(selectorSquares(store, false).entries()).map(
      ([square, task]): [number, Array<[number, number, number]>] => [
        square,
        map(task.state.colors, (value) => map(value, (value) => value)),
      ],
    ),
  )

  const squares = Array.from(values.keys())

  const colors = flattenDeep(
    squares.map((square): Array<[number, number, number]> => {
      // eslint-disable-next-line typescript/no-non-null-assertion
      const colors = values.get(square)!

      if (store.options.colorSpace === 'oklch') {
        return colors
      }

      return colors.map((coords) =>
        fixNaN(convert({ alpha: 1, coords, space: OKLrCH }, OKLCH).coords),
      )
    }),
  ).map((value) => toPrecision(value, store.options.precision))

  const triangleFlat = triangle
    .flat()
    .map((value) => toPrecision(value, store.options.precision)) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ]

  return [gamut, interval, length, triangleFlat, squares, colors]
}
