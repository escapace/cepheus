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
  const tasks = new Map(Object.entries(selectorOptimizeTasksFulfilled(store, iterations)))

  const result = new Map(
    compact(
      Array.from(store.indexSquare.entries()).map(([square, iterationsMap]) => {
        const keys = compact(iterations.map((iteration) => iterationsMap.get(iteration)))
        const key: string | undefined = keys.find((key) => tasks.has(key))

        if (typeof key === 'string') {
          // eslint-disable-next-line typescript/no-non-null-assertion
          const task = tasks.get(key)!

          if (task.state.colors.length === 0) {
            return undefined
          } else if (typeof index === 'number') {
            /* return undefined if that specific color position is null/undefined */
            return task.state.colors[index] === null || task.state.colors[index] === undefined
              ? undefined
              : [square, task]
          } else if (index) {
            /* return undefined if ALL colors are null/undefined */
            return task.state.colors.every((value) => value === null || value === undefined)
              ? undefined
              : [square, task]
          } else {
            // return undefined if ANY color is null
            return task.state.colors.some((value) => value === null || value === undefined)
              ? undefined
              : [square, task]
          }
        }

        return undefined
      }),
    ),
  )

  return result
}
