import { assign, isError, map, omit, range } from 'lodash-es'
import { setMaxListeners } from 'node:events'
import Tinypool from 'tinypool'
import { actionCreateOptimizeTasks } from './store/action-create-optimize-tasks'
import { actionUpdateOptimizeTask } from './store/action-update-optimize-task'
import { actionUpdateStage } from './store/action-update-stage'
import { createStore } from './store/create-store'
import { selectorOptimizeTasksPending } from './store/selector-optimize-tasks'
import { selectorRemainingSquares, selectorSquares } from './store/selector-squares'
import { selectorState } from './store/selector-state'
import {
  TypeCepheusState,
  type CepheusState,
  type OptimizationState,
  type OptimizeOptions,
  type OptimizeTask,
  type StoreOptions,
} from './types'

export {
  TypeCepheusState,
  type CepheusState,
  type CepheusStateAbort,
  type CepheusStateDone,
  type CepheusStateError,
  type CepheusStateOptimization,
  type CepheusStateOptimizationDone,
} from './types'

import { ColorSpace, HSL, HSV, LCH, OKLab, OKLCH, OKLrCH, P3, sRGB } from 'colorjs.io/fn'
import { toPrecision } from './utilities/to-precision'

ColorSpace.register(HSL)
ColorSpace.register(HSV)
ColorSpace.register(P3)
ColorSpace.register(OKLab)
ColorSpace.register(OKLCH)
ColorSpace.register(OKLrCH)
ColorSpace.register(sRGB)
ColorSpace.register(LCH)

export interface CepheusOptions extends StoreOptions {
  initialState?: Record<string, OptimizeTask>
}

export interface CepheusReturnType extends PromiseLike<CepheusState> {
  abort: () => void
  store: ReturnType<typeof createStore>
}

export const cepheus = (options: CepheusOptions): CepheusReturnType => {
  const store = createStore(options, options.initialState)

  const pool = new Tinypool({
    filename: new URL('./worker.js', import.meta.url).href,
    runtime: 'child_process',
  })

  const abortController = new AbortController()
  setMaxListeners(0, abortController.signal)

  const runTasks = async () => {
    const tasks = selectorOptimizeTasksPending(store)

    await pool.recycleWorkers()

    await Promise.all(
      map(Object.entries(tasks), async ([key, task]) => {
        const options: OptimizeOptions = omit(task.options, ['key'])

        const state = (await pool.run(options, {
          name: 'optimize',
          signal: abortController.signal,
        })) as OptimizationState

        await actionUpdateOptimizeTask(store, key, state)
      }),
    )
  }

  const promise = actionUpdateStage(store, {
    type: TypeCepheusState.Optimization,
  })
    .then(async () => {
      for (const iteration of range(store.options.iterations)) {
        actionCreateOptimizeTasks(store, iteration)

        await runTasks()
      }

      if (Array.from(selectorSquares(store)).length === 0) {
        throw new Error('No squares available.')
      }

      const attempt = async (tolerance: number) => {
        const squares = selectorRemainingSquares(store)

        if (squares.size === 0) {
          return true
        }

        for (const iteration of range(store.options.iterations)) {
          actionCreateOptimizeTasks(store, iteration, {
            squares,
            tolerance,
            weights: {
              ...store.options.weights,
              chroma: store.options.weights.chroma * tolerance,
              hue: store.options.weights.hue * tolerance,
              lightness: store.options.weights.lightness * tolerance,
            },
          })
        }

        await runTasks()

        return squares.size === 0
      }

      const tolerances = [...Array(20).keys()].map((_, index) => toPrecision(1 + ((index + 1) * 0.05), 5))

      for (const tolerance of tolerances) {
        if (await attempt(tolerance)) {
          break
        }
      }

      const missing = selectorRemainingSquares(store)

      if (missing.size !== 0) {
        throw new Error(
          `Unable to fit triangle, squares ${Array.from(missing.keys()).join(', ')} missing.`,
        )
      }

      await actionUpdateStage(store, {
        type: TypeCepheusState.OptimizationDone,
      })
    })
    .catch(async (error) =>
      isError(error) && error.name === 'AbortError'
        ? await actionUpdateStage(store, {
            type: TypeCepheusState.Abort,
          })
        : await actionUpdateStage(store, {
            error,
            type: TypeCepheusState.Error,
          }),
    )
    .then(async () => await pool.destroy())
    .then(async () => {
      const state = selectorState(store)

      if (state.type !== TypeCepheusState.Abort && state.type !== TypeCepheusState.Error) {
        return await actionUpdateStage(store, {
          type: TypeCepheusState.Done,
        })
      }
    })
    .then(() => selectorState(store))

  return assign(promise, {
    abort: () => abortController.abort(),
    store,
  })
}
