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
import { assign, isError, map, omit, range } from 'lodash-es'
// import Piscina from 'piscina'
import Tinypool from 'tinypool'

import { createStore } from './store'
import {
  CepheusState,
  OptimizationState,
  OptimizeOptions,
  OptimizeTask,
  StoreOptions,
  TriangleTaskOptions,
  TriangleTaskResult,
  TypeCepheusState
} from './types'
import { createTriangleTaskIterator } from './utilities/triangle'

export {
  TypeCepheusState,
  type CepheusState,
  type CepheusStateAbort,
  type CepheusStateDone,
  type CepheusStateError,
  type CepheusStateOptimization,
  type CepheusStateOptimizationDone,
  type CepheusStateTriangleFitting,
  type CepheusStateTriangleFittingDone
} from './types'

export interface CepheusOptions extends StoreOptions {
  initialState?: Record<string, OptimizeTask>
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

  const pool = new Tinypool({
    filename: new URL('./worker.mjs', import.meta.url).href
  })

  const abortController = new AbortController()
  setMaxListeners(0, abortController.signal)

  const promise = store
    .actionUpdateStage({ type: TypeCepheusState.Optimization })
    .then(async () => {
      const iterations = range(store.options.iterations)

      for (const iteration of iterations) {
        store.actionCreateOptimizeTasks(iteration)

        const tasks = store.optimizeTasksPending()

        await Promise.all(
          map(Object.entries(tasks), async ([key, task]) => {
            const options: OptimizeOptions = omit(task.options, ['key'])

            const state = (await pool.run(options, {
              name: 'optimize',
              signal: abortController.signal
            })) as OptimizationState

            await store.actionUpdateOptimizeTask(key, state)
          })
        )
      }

      if (Array.from(store.squares()).length > 0) {
        return await store.actionUpdateStage({
          type: TypeCepheusState.OptimizationDone
        })
      }

      throw new Error('No squares available.')
    })
    .then(async () => {
      await store.actionUpdateStage({
        type: TypeCepheusState.TriangleFitting
      })

      const { factors, pixels } = store.triangleOptions()

      const iterator = createTriangleTaskIterator(factors)

      const next = async () => {
        for (const triangles of iterator) {
          const options: TriangleTaskOptions = {
            triangles,
            pixels
          }

          const value = (await pool.run(options, {
            name: 'triangle',
            signal: abortController.signal
          })) as TriangleTaskResult

          await store.actionUpdateTriangleTask(value)
        }
      }

      await Promise.all(
        range(pool.options.minThreads).map(async () => await next())
      )

      if (store.triangle() === undefined) {
        throw new Error('Triangle fitting failed.')
      }

      await store.actionUpdateStage({
        type: TypeCepheusState.TriangleFittingDone
      })
    })
    .catch(async (error) => {
      if (isError(error) && error.name === 'AbortError') {
        return await store.actionUpdateStage({
          type: TypeCepheusState.Abort
        })
      } else {
        return await store.actionUpdateStage({
          type: TypeCepheusState.Error,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          error
        })
      }
    })
    .then(async () => await pool.destroy())
    .then(async () => {
      if (
        store.state().type !== TypeCepheusState.Abort ||
        store.state().type !== TypeCepheusState.Error
      ) {
        return await store.actionUpdateStage({
          type: TypeCepheusState.Done
        })
      }
    })
    .then(() => store.state())

  return assign(promise, {
    abort: () => abortController.abort(),
    store
  })
}
