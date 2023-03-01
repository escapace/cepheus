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
import { assign, difference, isError, map, omit, range } from 'lodash-es'
import Tinypool from 'tinypool'
import { actionCreateOptimizeTasks } from './store/action-create-optimize-tasks'
import { actionUpdateOptimizeTask } from './store/action-update-optimize-task'
import { actionUpdateStage } from './store/action-update-stage'
import { createStore } from './store/create-store'
import { selectorOptimizeTasksPending } from './store/selector-optimize-tasks'
import { selectorSquares } from './store/selector-squares'
import { selectorState } from './store/selector-state'
import { selectorTriangle } from './store/selector-triangle'
import {
  CepheusState,
  OptimizationState,
  OptimizeOptions,
  OptimizeTask,
  StoreOptions,
  TypeCepheusState
} from './types'

export {
  TypeCepheusState,
  type CepheusState,
  type CepheusStateAbort,
  type CepheusStateDone,
  type CepheusStateError,
  type CepheusStateOptimization,
  type CepheusStateOptimizationDone
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
      for (const iteration of range(store.options.iterations)) {
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

      if (Array.from(selectorSquares(store)).length === 0) {
        throw new Error('No squares available.')
      }

      const { squares } = selectorTriangle(store)

      for (const iteration of range(Math.max(store.options.iterations, 4))) {
        actionCreateOptimizeTasks(store, iteration, {
          squares,
          hueAngle: store.options.hueAngle * 1.5,
          weights: {
            ...store.options.weights,
            lightness: store.options.weights.lightness * 2,
            chroma: store.options.weights.chroma * 2,
            hue: store.options.weights.hue * 2
          }
        })

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

      const missing = difference(
        Array.from(squares.keys()),
        Array.from(selectorSquares(store).keys())
      )

      if (missing.length !== 0) {
        throw new Error(
          `Unable to fit triangle, squares ${missing.join(', ')} missing.`
        )
      }

      await actionUpdateStage(store, {
        type: TypeCepheusState.OptimizationDone
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
