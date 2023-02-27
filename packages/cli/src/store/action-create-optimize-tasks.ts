import { tile } from '@cepheus/utilities'
import { TypeOptimizationState } from '../types'
import { objectHash } from '../utilities/object-hash'
import { createOptimizeTaskOptions } from './create-optimize-task-options'
import { Store } from './create-store'

export function actionCreateOptimizeTasks(store: Store, iteration: number) {
  const squares = tile(store.options.interval)

  squares.forEach((square) => {
    store.indexSquare.set(square, new Map<number, string>())
  })

  squares.forEach((square) => {
    const optimizeTaskOptions = createOptimizeTaskOptions(
      square,
      store.options.interval,
      iteration,
      store.options
    )

    // const options = taskOptionsFrom(square, iteration, storeOptions)
    // @ts-expect-error unable to type JSONType
    const key = objectHash(optimizeTaskOptions)

    if (!store.indexState.has(key)) {
      if (store.indexInitialState.has(key)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        store.indexState.set(key, store.indexInitialState.get(key)!)
      } else {
        store.indexState.set(key, {
          options: optimizeTaskOptions,
          state: {
            type: TypeOptimizationState.Pending
          }
        })
      }
    }

    store.indexSquare.get(square)?.set(iteration, key)
  })
}
