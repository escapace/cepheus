import type { OptimizationState, OptimizeTask } from '../types'
import type { Store } from './create-store'

export async function actionUpdateOptimizeTask(
  store: Store,
  key: string,
  state: OptimizationState
) {
  const value = store.indexState.get(key)

  if (value === undefined) {
    throw new Error('Task key unknown.')
  }

  const task: OptimizeTask = {
    ...value,
    state
  }

  store.indexState.set(key, task)

  await store.emit('optimizeTask', [key, task])
}
