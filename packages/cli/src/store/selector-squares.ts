import { tile } from '@cepheus/utilities'
import { compact } from 'lodash-es'
import type { OptimizationStateFulfilled, OptimizeTask } from '../types'
import { isSquareInsideTriangle } from '../utilities/is-square-inside-triangle'
import { createSquareOptions } from './create-square-options'
import type { Store } from './create-store'
import { selectorOptimizeTasksFulfilled } from './selector-optimize-tasks'
import { selectorTriangle } from './selector-triangle'

export const selectorSquares = (
  store: Store,
  iterations: number[] = store.allIterations,
): Map<number, OptimizeTask<OptimizationStateFulfilled>> => {
  const bestTasks = new Map(Object.entries(selectorOptimizeTasksFulfilled(store, iterations)))

  const result = new Map(
    compact(
      Array.from(store.indexSquare.entries()).map(([square, iterationsMap]) => {
        const keys = compact(iterations.map((iteration) => iterationsMap.get(iteration)))

        const key: string | undefined = keys.find((key) => bestTasks.has(key))

        if (key !== undefined) {
          // eslint-disable-next-line typescript/no-non-null-assertion
          const task = bestTasks.get(key)!

          return [square, task]
        }

        return undefined
      }),
    ),
  )

  return result
}

export const selectorRemainingSquares = (store: Store) => {
  const { interval } = store.options
  const triangle = selectorTriangle(store)
  const squares = Array.from(selectorSquares(store).keys())

  return new Map(
    tile(interval)
      .filter((square) => {
        if (squares.includes(square)) {
          return false
        }

        return isSquareInsideTriangle(square, interval, triangle)
      })
      .map((square) => [square, createSquareOptions(square, interval)] as const),
  )
}

// return new Map(
//   difference(
//     Array.from(remainingSquares.keys()),
//     squares,
//     // eslint-disable-next-line typescript/no-non-null-assertion
//   ).map((value) => [value, remainingSquares.get(value)!]),
// )
