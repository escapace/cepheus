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
} from '@cepheus/color'
import { setMaxListeners } from 'events'
import { assign, isError, map } from 'lodash-es'
import Piscina from 'piscina'
import { createStore } from './store'
import {
  CepheusState,
  CepheusStateError,
  CepheusStateOptimizationAbort,
  CepheusStateOptimizationDone,
  OptimizationState,
  StoreOptions,
  Task,
  TypeCepheusState
} from './types'

export {
  TypeCepheusState,
  type CepheusState,
  type CepheusStateDone,
  type CepheusStateError,
  type CepheusStateNone,
  type CepheusStateOptimizationAbort,
  type CepheusStateOptimizationDone
} from './types'

export interface CepheusOptions extends StoreOptions {
  initialState?: Record<string, Task>
}

export interface CepheusReturnType extends PromiseLike<CepheusState> {
  abort: () => void
  store: ReturnType<typeof createStore>
}

export const cepheus = (options: CepheusOptions): CepheusReturnType => {
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
    .actionUpdateStage({ type: TypeCepheusState.None })
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
    .then((): CepheusStateOptimizationDone => {
      return { type: TypeCepheusState.OptimizationDone }
    })
    .catch((error): CepheusStateOptimizationAbort | CepheusStateError => {
      if (isError(error) && error.name === 'AbortError') {
        return { type: TypeCepheusState.OptimizationAbort }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        return { type: TypeCepheusState.Error, error }
      }
    })
    .then(async (value) => await store.actionUpdateStage(value))
    .then(async () => await piscina.destroy())
    .then(async () => {
      if (Array.from(store.cubes()).length > 0) {
        return await store.actionUpdateStage({
          type: TypeCepheusState.Done,
          model: store.model()
        })
      }

      return await store.actionUpdateStage({
        type: TypeCepheusState.Error,
        error: 'No cubes available.'
      })
    })
    .then(() => store.state())

  return assign(promise, {
    promise,
    abort: () => abortController.abort(),
    store
  })
}
