/* eslint-disable @typescript-eslint/promise-function-async */
import {
  ColorSpace,
  HSL,
  HSV,
  LCH,
  OKLab,
  OKLCH,
  P3,
  sRGB
} from '@escapace/bruni-color'
import { setMaxListeners } from 'events'
import { assign, isError, map } from 'lodash-es'
import Piscina from 'piscina'
import { createStore } from './store'
import {
  BruniState,
  BruniStateOptimizationAbort,
  BruniStateOptimizationDone,
  BruniStateOptimizationError,
  OptimizationState,
  StoreOptions,
  Task,
  TypeBruniState
} from './types'

export {
  TypeBruniState,
  type BruniState,
  type BruniStateDone,
  type BruniStateNone,
  type BruniStateOptimizationDone,
  type BruniStateOptimizationAbort,
  type BruniStateOptimizationError
} from './types'

export interface BruniOptions extends StoreOptions {
  initialState?: Record<string, Task>
}

export interface BruniReturnType extends PromiseLike<BruniState> {
  abort: () => void
  store: ReturnType<typeof createStore>
}

export const bruni = (options: BruniOptions): BruniReturnType => {
  ColorSpace.register(HSL)
  ColorSpace.register(HSV)
  ColorSpace.register(P3)
  ColorSpace.register(OKLab)
  ColorSpace.register(OKLCH)
  ColorSpace.register(sRGB)
  ColorSpace.register(LCH)

  const store = createStore(options, options.initialState)

  const tasks = store.tasksPending()

  const piscina = new Piscina({
    filename: new URL('./worker.mjs', import.meta.url).href
  })

  const abortController = new AbortController()
  setMaxListeners(0, abortController.signal)

  const promise = store
    .actionUpdateStage({ type: TypeBruniState.None })
    .then(() =>
      Promise.all(
        map(Object.entries(tasks), async ([key, task]) => {
          const state = (await piscina.run(task.options, {
            name: 'optimize',
            signal: abortController.signal
          })) as OptimizationState

          await store.actionUpdateTask(key, state)
        })
      )
    )
    .then((): BruniStateOptimizationDone => {
      return { type: TypeBruniState.OptimizationDone }
    })
    .catch(
      (error): BruniStateOptimizationAbort | BruniStateOptimizationError => {
        if (isError(error) && error.name === 'AbortError') {
          return { type: TypeBruniState.OptimizationAbort }
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          return { type: TypeBruniState.OptimizationError, error }
        }
      }
    )
    .then(async (value) => await store.actionUpdateStage(value))
    .then(async () => await piscina.destroy())
    .then(
      async () =>
        await store.actionUpdateStage({
          type: TypeBruniState.Done
          // value: Array.from(store.cubes().entries()).map(([num, task]) => {
          //   return [num, task.state.colors]
          // })
        })
    )
    .then(() => store.state())

  return assign(promise, {
    promise,
    abort: () => abortController.abort(),
    store
  })
}
