import { ModelUnparsed } from 'cepheus'
import { flattenDeep, map } from 'lodash-es'
import { toPrecision } from '../utilities/to-precision'
import { Store } from './create-store'
import { selectorSquares } from './selector-squares'
import { selectorTriangle } from './selector-triangle'

export const selectorModel = (store: Store): ModelUnparsed => {
  const values = new Map(
    Array.from(selectorSquares(store, store.allIterations).entries()).map(
      ([square, task]): [number, Array<[number, number, number]>] => {
        return [
          square,
          map(
            task.state.colors,
            (value) =>
              map(value, (value) =>
                toPrecision(value, store.options.precision)
              ) as [number, number, number]
          )
        ]
      }
    )
  )

  const interval = store.options.interval
  const length = store.options.colors.length
  const squares = Array.from(values.keys())

  const colors = flattenDeep(
    squares.map(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (square): Array<[number, number, number]> => values.get(square)!
    )
  ) as number[]

  const triangle = selectorTriangle(store)
    .triangle.flat()
    .map((value) => toPrecision(value, store.options.precision)) as [
    number,
    number,
    number,
    number,
    number,
    number
  ]

  const space = store.options.colorSpace as number

  return [space, interval, length, triangle, squares, colors]
}
