import { compact } from 'lodash-es'
import type { OptimizationStateFulfilled, OptimizeTask } from '../types'
import type { Store } from './create-store'
import { selectorOptimizeTasksFulfilled } from './selector-optimize-tasks'

export function selectorSquares(
  store: Store,
  index?: number | true,
  iterations?: number[],
): Map<number, OptimizeTask<OptimizationStateFulfilled>>
export function selectorSquares(
  store: Store,
  index?: false,
  iterations?: number[],
): Map<number, OptimizeTask<OptimizationStateFulfilled<'false'>>>
export function selectorSquares(
  store: Store,
  index: number | false | true = false,
  iterations: number[] = store.allIterations,
):
  | Map<number, OptimizeTask<OptimizationStateFulfilled<'false'>>>
  | Map<number, OptimizeTask<OptimizationStateFulfilled>> {
  const bestTasks = new Map(Object.entries(selectorOptimizeTasksFulfilled(store, iterations)))

  const result = new Map(
    compact(
      Array.from(store.indexSquare.entries()).map(([square, iterationsMap]) => {
        const keys = compact(iterations.map((iteration) => iterationsMap.get(iteration)))
        const key: string | undefined = keys.find((key) => bestTasks.has(key))

        if (key !== undefined) {
          // eslint-disable-next-line typescript/no-non-null-assertion
          const task = bestTasks.get(key)!

          if (index === false && task.state.colors.includes(null)) {
            return undefined
          } else if (typeof index === 'number') {
            return task.state.colors[index] === null || task.state.colors[index] === undefined
              ? undefined
              : [square, task]
          } else {
            return [square, task]
          }
        }

        return undefined
      }),
    ),
  )

  return result
}
