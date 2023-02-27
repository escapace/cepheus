import Emittery from 'emittery'
import { range } from 'lodash-es'
import {
  CepheusState,
  OptimizeTask,
  RequiredStoreOptions,
  Square,
  StoreOptions,
  TriangleTaskResult,
  TypeCepheusState
} from '../types'
import { createStoreOptions } from './create-store-options'

export interface Store
  extends Pick<
    ReturnType<typeof createEmitter>,
    'on' | 'events' | 'anyEvent' | 'clearListeners' | 'emit'
  > {
  indexInitialState: Map<string, OptimizeTask>
  indexSquare: Map<Square, Map<number, string>>
  indexState: Map<string, OptimizeTask>
  log: CepheusState[]
  options: RequiredStoreOptions
  triangleTaskResults: TriangleTaskResult[]
  allIterations: number[]
}

const createEmitter = () =>
  new Emittery<{
    triangleTask: undefined
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

  const indexSquare: Map<Square, Map<number, string>> = new Map()

  const indexState: Map<string, OptimizeTask> = new Map()

  const triangleTaskResults: TriangleTaskResult[] = []

  const indexInitialState: Map<string, OptimizeTask> = new Map(
    Object.entries(initialState)
  )

  const allIterations = range(storeOptions.iterations)

  const store = {
    options: storeOptions,
    log,
    indexSquare,
    indexState,
    triangleTaskResults,
    indexInitialState,
    allIterations
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const storeWithEmitter = { ...store } as Pick<
    typeof emitter,
    'on' | 'events' | 'anyEvent' | 'clearListeners' | 'emit'
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
