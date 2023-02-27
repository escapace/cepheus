import { BigNumber } from 'bignumber.js'
import { flattenDeep, map } from 'lodash-es'
import { Model } from '../types'
import { Store } from './create-store'
import { selectorSquares } from './selector-squares'
import { selectorTriangle } from './wip'

export const selectorModel = (store: Store, precision = 5): Model => {
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
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const colors = flattenDeep(squares.map((square) => values.get(square)!))
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

  return [interval, length, triangleF, squares, colors]
}
