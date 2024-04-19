import Emittery from 'emittery'
import { range } from 'lodash-es'
import {
  type CepheusState,
  type OptimizeTask,
  type RequiredStoreOptions,
  type Square,
  type StoreOptions,
  TypeCepheusState
} from '../types'
import { createStoreOptions } from './create-store-options'

export interface Store
  extends Pick<
    ReturnType<typeof createEmitter>,
    'anyEvent' | 'clearListeners' | 'emit' | 'events' | 'on'
  > {
  allIterations: number[]
  indexInitialState: Map<string, OptimizeTask>
  indexSquare: Map<Square, Map<number, string>>
  indexState: Map<string, OptimizeTask>
  log: CepheusState[]
  options: RequiredStoreOptions
}

const createEmitter = () =>
  new Emittery<{
    optimizeTask: [string, OptimizeTask]
    state: CepheusState
  }>()

export const createStore = (
  options: StoreOptions,
  initialState: Record<string, OptimizeTask> = {}
): Store => {
  const log: CepheusState[] = [{ type: TypeCepheusState.Optimization }]

  const emitter = createEmitter()

  const storeOptions = createStoreOptions(options)

  const indexSquare = new Map<Square, Map<number, string>>()

  const indexState = new Map<string, OptimizeTask>()

  const indexInitialState = new Map<string, OptimizeTask>(
    Object.entries(initialState)
  )

  const allIterations = range(Math.max(storeOptions.iterations * 2, 4))

  const store = {
    allIterations,
    indexInitialState,
    indexSquare,
    indexState,
    log,
    options: storeOptions
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const storeWithEmitter = { ...store } as Pick<
    typeof emitter,
    'anyEvent' | 'clearListeners' | 'emit' | 'events' | 'on'
  > &
    typeof store

  emitter.bindMethods(storeWithEmitter, [
    'emit',
    'on',
    'events',
    'anyEvent',
    'clearListeners'
  ])

  return storeWithEmitter
}
