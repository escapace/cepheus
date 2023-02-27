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
import { actionCreateOptimizeTasks } from './store/action-create-optimize-tasks'
import { actionUpdateOptimizeTask } from './store/action-update-optimize-task'

import { actionUpdateStage } from './store/action-update-stage'
import { createStore } from './store/create-store'
import { selectorOptimizeTasksPending } from './store/selector-optimize-tasks'
import { selectorSquares } from './store/selector-squares'
import { selectorState } from './store/selector-state'
import {
  actionUpdateTriangleTask,
  selectorTriangle,
  selectorTriangleOptions
} from './store/wip'
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

  const promise = actionUpdateStage(store, {
    type: TypeCepheusState.Optimization
  })
    .then(async () => {
      const iterations = range(store.options.iterations)

      // try {
      for (const iteration of iterations) {
        actionCreateOptimizeTasks(store, iteration)

        const tasks = selectorOptimizeTasksPending(store)

        await Promise.all(
          map(Object.entries(tasks), async ([key, task]) => {
            const options: OptimizeOptions = omit(task.options, ['key'])

            const state = (await pool.run(options, {
              name: 'optimize',
              signal: abortController.signal
            })) as OptimizationState

            await actionUpdateOptimizeTask(store, key, state)
          })
        )
      }
      // } catch (e) {}

      if (Array.from(selectorSquares(store)).length === 0) {
        throw new Error('No squares available.')
      }

      await actionUpdateStage(store, {
        type: TypeCepheusState.OptimizationDone
      })

      await actionUpdateStage(store, {
        type: TypeCepheusState.TriangleFitting
      })

      const { factors, pixels } = selectorTriangleOptions(store)

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

          await actionUpdateTriangleTask(store, value)
        }
      }

      await Promise.all(
        range(pool.options.minThreads).map(async () => await next())
      )

      if (selectorTriangle(store) === undefined) {
        throw new Error('Triangle fitting failed!')
      }

      await actionUpdateStage(store, {
        type: TypeCepheusState.TriangleFittingDone
      })
    })
    .catch(async (error) => {
      if (isError(error) && error.name === 'AbortError') {
        return await actionUpdateStage(store, {
          type: TypeCepheusState.Abort
        })
      } else {
        return await actionUpdateStage(store, {
          type: TypeCepheusState.Error,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          error
        })
      }
    })
    .then(async () => await pool.destroy())
    .then(async () => {
      const state = selectorState(store)

      if (
        !(
          state.type === TypeCepheusState.Abort ||
          state.type === TypeCepheusState.Error
        )
      ) {
        return await actionUpdateStage(store, {
          type: TypeCepheusState.Done
        })
      }
    })
    .then(() => selectorState(store))

  return assign(promise, {
    abort: () => abortController.abort(),
    store
  })
}
