import { BigNumber } from 'bignumber.js'
import { ModelUnparsed } from 'cepheus'
import { flattenDeep, map } from 'lodash-es'
import { Store } from './create-store'
import { selectorSquares } from './selector-squares'
import { selectorTriangle } from './wip'

export const selectorModel = (store: Store, precision = 5): ModelUnparsed => {
  const values = new Map(
    Array.from(selectorSquares(store, store.allIterations).entries()).map(
      ([square, task]): [number, Array<[number, number, number]>] => {
        return [
          square,
          map(
            task.state.colors,
            (value) =>
              map(value, (value) =>
                Number.isFinite(precision)
                  ? parseFloat(new BigNumber(value).toPrecision(5))
                  : value
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

  if (triangle === undefined) {
    throw new Error('Triangle fitting failed.')
  }

  const triangleF = triangle.flat() as [
    number,
    number,
    number,
    number,
    number,
    number
  ]

  const space = store.options.colorSpace as number

  return [space, interval, length, triangleF, squares, colors]
}
