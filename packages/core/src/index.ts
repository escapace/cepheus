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
import { OptimizationState } from './optimize'
import { createStore, StoreOptions, Task } from './store'

ColorSpace.register(HSL)
ColorSpace.register(HSV)
ColorSpace.register(P3)
ColorSpace.register(OKLab)
ColorSpace.register(OKLCH)
ColorSpace.register(sRGB)
ColorSpace.register(LCH)

export enum TypeBruniState {
  None,
  Done,
  Error,
  Abort
}

export interface BruniStateNone {
  type: TypeBruniState.None
}

export interface BruniStateDone {
  type: TypeBruniState.Done
}

export interface BruniStateError {
  type: TypeBruniState.Error
  error: unknown
}

export interface BruniStateAbort {
  type: TypeBruniState.Abort
}

export type BruniState =
  | BruniStateNone
  | BruniStateDone
  | BruniStateError
  | BruniStateAbort

export interface Options extends StoreOptions {
  initialState?: Record<string, Task>
}

export interface BruniReturnType extends PromiseLike<BruniState> {
  abort: () => void
  store: ReturnType<typeof createStore>
}

export const bruni = (options: Options): BruniReturnType => {
  const store = createStore(options, options.initialState)

  const tasks = store.tasksPending()

  const piscina = new Piscina({
    filename: new URL('./worker.mjs', import.meta.url).href
  })

  const abortController = new AbortController()
  setMaxListeners(0, abortController.signal)

  const log: BruniState[] = [{ type: TypeBruniState.None }]

  const promise: Promise<BruniState> = Promise.all(
    map(Object.entries(tasks), async ([key, task]) => {
      const state = (await piscina.run(task.options, {
        name: 'optimize',
        signal: abortController.signal
      })) as OptimizationState

      await store.updateTask(key, state)
    })
  )
    .then(() => {
      log.unshift({ type: TypeBruniState.Done })
    })
    .catch((error) => {
      if (isError(error) && error.name === 'AbortError') {
        log.unshift({ type: TypeBruniState.Abort })
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        log.unshift({ type: TypeBruniState.Error, error })
      }
    })
    .then(async () => {
      await piscina.destroy()

      return log[0]
    })

  return assign(promise, {
    promise,
    abort: () => abortController.abort(),
    store
  })
}
