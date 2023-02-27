import { isolate } from '@cepheus/utilities'
import { compact, difference } from 'lodash-es'
import { OptimizationStateFulfilled, OptimizeTask } from '../types'
import { Store } from './create-store'
import { selectorOptimizeTasksFulfilled } from './selector-optimize-tasks'

export const selectorSquares = (
  store: Store,
  iterations: number[] = store.allIterations
): Map<number, OptimizeTask<OptimizationStateFulfilled>> => {
  const bestTasks = new Map(
    Object.entries(selectorOptimizeTasksFulfilled(store, iterations))
  )

  const result = new Map(
    compact(
      Array.from(store.indexSquare.entries()).map(([square, iterationsMap]) => {
        const keys = compact(
          iterations.map((iteration) => iterationsMap.get(iteration))
        )

        const key: string | undefined = keys.filter((key) =>
          bestTasks.has(key)
        )[0]

        if (key !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const task = bestTasks.get(key)!

          return [square, task]
        }

        return undefined
      })
    )
  )

  const squares = Array.from(result.keys())

  difference(
    squares,
    isolate(squares, store.options.interval, false)[0]
  ).forEach((square) => result.delete(square))

  return result
}
