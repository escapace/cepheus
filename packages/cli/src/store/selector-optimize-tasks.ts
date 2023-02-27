import { N } from '@cepheus/utilities'
import { compact, groupBy, map, memoize, uniq } from 'lodash-es'
import {
  OptimizationStateFulfilled,
  OptimizationStatePending,
  OptimizeTask,
  TypeOptimizationState
} from '../types'
import { objectHash } from '../utilities/object-hash'
import { Store } from './create-store'

export const selectorOptimizeTasksPending = (
  store: Store
): Record<string, OptimizeTask<OptimizationStatePending>> =>
  Object.fromEntries(
    Array.from(store.indexState.entries()).filter(
      ([_, task]) => task.state.type === TypeOptimizationState.Pending
    )
  ) as Record<string, OptimizeTask<OptimizationStatePending>>

export const selectorOptimizeTasksNotPending = (
  store: Store
): Record<string, OptimizeTask> =>
  Object.fromEntries(
    Array.from(store.indexState.entries()).filter(
      ([_, task]) => task.state.type !== TypeOptimizationState.Pending
    )
  )

const selectorOptimizeTasksFulfilledAll = (
  store: Store,
  iterations: number[]
): Record<string, OptimizeTask<OptimizationStateFulfilled>> => {
  const keys = uniq(
    Array.from(store.indexSquare.values()).flatMap((iterationsMap) => {
      return compact(
        iterations.map((iteration) => iterationsMap.get(iteration))
      )
    })
  )

  return Object.fromEntries(
    Array.from(store.indexState.entries()).filter(
      ([key, task]) =>
        keys.includes(key) &&
        task.state.type === TypeOptimizationState.Fulfilled
    )
  ) as Record<string, OptimizeTask<OptimizationStateFulfilled>>
}

export const selectorOptimizeTasksFulfilled = (
  store: Store,
  iterations: number[]
): Record<string, OptimizeTask<OptimizationStateFulfilled>> =>
  Object.fromEntries(
    map(
      groupBy(
        Object.values(selectorOptimizeTasksFulfilledAll(store, iterations)),
        (value) => value.options.key
      ),
      (array) => {
        const value = [...array].sort(
          ({ state: { cost: a } }, { state: { cost: b } }) => a - b
        )[0]

        // @ts-expect-error unable to type JSONType
        const key = objectHash(value.options)

        const task = store.indexState.get(
          key
        ) as OptimizeTask<OptimizationStateFulfilled>

        return [key, task] as const
      }
    )
  )

const selectorOptimizeTasksCountTotal = memoize(
  (store: Store): number =>
    store.options.iterations * Math.pow(N / store.options.interval, 2)
)

export const selectorOptimizeTasksCount = (store: Store) => {
  return Array.from(store.indexState.values()).reduce(
    (counts, task) => {
      switch (task.state.type) {
        case TypeOptimizationState.Rejected:
          counts.rejected++
          break
        case TypeOptimizationState.Fulfilled:
          counts.fulfilled++
          break
        case TypeOptimizationState.Pending:
          counts.pending++
      }

      return counts
    },
    {
      total: selectorOptimizeTasksCountTotal(store),
      pending: 0,
      rejected: 0,
      fulfilled: 0
    }
  )
}
