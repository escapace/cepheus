import { memoize } from 'lodash-es'
import { Triangle, TriangleOptions, TriangleTaskResult } from '../types'
import {
  createTriangleOptions,
  TRIANGLE_TASK_BATCH_SIZE
} from '../utilities/triangle'
import { Store } from './create-store'
import { selectorSquares } from './selector-squares'

export const actionUpdateTriangleTask = async (
  store: Store,
  result: TriangleTaskResult
) => {
  store.triangleTaskResults.push(result)

  await store.emit('triangleTask')
}

export const selectorTriangle = (store: Store): Triangle | undefined => {
  const results: Array<Exclude<TriangleTaskResult, undefined>> =
    store.triangleTaskResults
      .filter(
        (value): value is Exclude<TriangleTaskResult, undefined> =>
          value !== undefined
      )
      .sort((a, b) => b[1] - a[1])

  if (results.length === 0) {
    return undefined
  }

  return results[0][0] as Triangle
}

export const selectorTriangleOptions: (store: Store) => TriangleOptions =
  memoize((store: Store): TriangleOptions => {
    return createTriangleOptions(
      store.options.interval,
      Array.from(selectorSquares(store).keys())
    )
  })

const selectorTriangleTasksCountTotal = memoize((store: Store): number => {
  const { factors } = selectorTriangleOptions(store)

  return Math.ceil(
    (factors[0].length * factors[1].length * factors[2].length) /
      TRIANGLE_TASK_BATCH_SIZE
  )
})

export const selectorTriangleTasksCount = (store: Store) => {
  const total = selectorTriangleTasksCountTotal(store)
  const rejected =
    store.triangleTaskResults?.filter((value) => value === undefined).length ??
    0
  const fulfilled = (store.triangleTaskResults?.length ?? 0) - rejected

  return {
    total,
    rejected,
    fulfilled
  }
}
