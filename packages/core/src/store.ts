import { convert, OKLCH, parse } from '@escapace/bruni-color'
import Emittery from 'emittery'
import {
  compact,
  groupBy,
  isInteger,
  isString,
  map,
  omit,
  range
} from 'lodash-es'
import { mean, standardDeviation } from 'simple-statistics'
import {
  BruniState,
  Cube,
  INTERVAL,
  Model,
  OptimizationState,
  OptimizationStateFulfilled,
  OptimizationStatePending,
  RequiredStoreOptions,
  StoreOptions,
  Task,
  TaskOptions,
  TypeBruniState,
  TypeOptimizationState
} from './types'
import { cartesianProduct } from './utilities/cartesian-product'
import { fixNaN } from './utilities/fix-nan'
import { hash } from './utilities/hash'
import { objectHash } from './utilities/object-hash'
import { szudzik, unszudzik } from './utilities/szudzik'

const fromXYZ = (value: [number, number, number], interval: number): number =>
  szudzik(...value.map((v) => v / interval))

const toXYZ = (cube: Cube): [number, number, number] =>
  unszudzik(cube.position, 3).map((v) => v * cube.interval) as [
    number,
    number,
    number
  ]

const tile = (interval: INTERVAL = 50): Cube[] => {
  const distribution = range(0, 100, interval)

  return cartesianProduct(distribution, distribution, distribution).map(
    (value): Cube => ({
      interval,
      position: fromXYZ(value as [number, number, number], interval)
    })
  )
}

const rangeFrom = (cube: Cube) => {
  const positions = toXYZ(cube)

  const [lightness, chroma, contrast] = range(3).map((_, index) => {
    const range = [positions[index], positions[index] + cube.interval] as [
      number,
      number
    ]

    const target = mean(range)

    return {
      range,
      target
    }
  })

  return {
    lightness,
    chroma,
    contrast
  }
}

const normalizeOptions = (options: StoreOptions): RequiredStoreOptions => {
  const colors = options.colors.map(
    (value) =>
      fixNaN(
        convert(isString(value) ? parse(value) : value, OKLCH, {
          inGamut: true
        })
      ).coords
  )

  const background = fixNaN(
    convert(
      isString(options.background)
        ? parse(options.background)
        : options.background,
      OKLCH,
      {
        inGamut: true
      }
    )
  ).coords

  const interval = (100 / (options.levels ?? 4)) as INTERVAL
  const tries = options.tries ?? 3

  if (![2, 4, 5, 10, 20, 25, 50].includes(interval)) {
    throw new Error(`'levels' must be one of 2, 4, 5, 10, 20, 25 or 50`)
  }

  if (!(isInteger(tries) && tries >= 1)) {
    throw new Error(`'tries' must be an integer greater or equal to 1`)
  }

  return {
    ...omit(options, ['levels']),
    background,
    colors,
    interval,
    tries
  }
}

const taskOptionsFrom = (
  cube: Cube,
  options: RequiredStoreOptions,
  n = 0
): TaskOptions => ({
  key: hash(cube.position, cube.interval, options.randomSeed),
  randomSeed: hash(n, cube.position, cube.interval, options.randomSeed),
  randomSource: options.randomSource,
  colors: options.colors,
  background: options.background,
  colorSpace: options.colorSpace,
  hyperparameters: options.hyperparameters,
  weights: options.weights,
  ...rangeFrom(cube)
})

export const createStore = (
  options: StoreOptions,
  initialState: Record<string, Task> = {}
) => {
  const log: BruniState[] = [{ type: TypeBruniState.None }]

  const storeOptions = normalizeOptions(options)
  const emitter = new Emittery<{
    task: [string, Task]
    state: BruniState
  }>()

  const cubes = tile(storeOptions.interval)

  const indexCube: Map<number, Set<string>> = new Map(
    cubes.map((value) => [value.position, new Set()])
  )

  const indexState: Map<string, Task> = new Map()
  const indexInitialState: Map<string, Task> = new Map(
    Object.entries(initialState)
  )

  cubes.forEach((cube) => {
    range(storeOptions.tries).forEach((n) => {
      const options = taskOptionsFrom(cube, storeOptions, n)

      // @ts-expect-error unable to type JSONType
      const key = objectHash(options)

      if (!indexState.has(key)) {
        if (indexInitialState.has(key)) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          indexState.set(key, indexInitialState.get(key)!)
        } else {
          indexState.set(key, {
            options,
            state: {
              type: TypeOptimizationState.Pending
            }
          })
        }
      }

      indexCube.get(cube.position)?.add(key)
    })
  })

  const actionUpdateTask = async (key: string, state: OptimizationState) => {
    const value = indexState.get(key)

    if (value === undefined) {
      throw new Error('Task key unknown.')
    }

    const task: Task = {
      ...value,
      state
    }

    indexState.set(key, task)

    await emitter.emit('task', [key, task])
  }

  const actionUpdateStage = async (value: BruniState) => {
    log.unshift(value)

    await emitter.emit('state', value)
  }

  const selectorTasksPending = (): Record<
    string,
    Task<OptimizationStatePending>
  > =>
    Object.fromEntries(
      Array.from(indexState.entries()).filter(
        ([_, task]) => task.state.type === TypeOptimizationState.Pending
      )
    ) as Record<string, Task<OptimizationStatePending>>
  //
  const selectorTasksNotPending = (): Record<string, Task> =>
    Object.fromEntries(
      Array.from(indexState.entries()).filter(
        ([_, task]) => task.state.type !== TypeOptimizationState.Pending
      )
    )

  const selectorTasksFulfilledAll = (): Record<
    string,
    Task<OptimizationStateFulfilled>
  > =>
    Object.fromEntries(
      Array.from(indexState.entries()).filter(
        ([_, task]) => task.state.type === TypeOptimizationState.Fulfilled
      )
    ) as Record<string, Task<OptimizationStateFulfilled>>

  const selectorTasksFulfilled = (): Record<
    string,
    Task<OptimizationStateFulfilled>
  > =>
    Object.fromEntries(
      map(
        groupBy(
          Object.values(selectorTasksFulfilledAll()),
          (value) => value.options.key
        ),
        (array) => {
          const value = [...array].sort(
            ({ state: { cost: a } }, { state: { cost: b } }) => a - b
          )[0]

          // @ts-expect-error unable to type JSONType
          const key = objectHash(value.options)

          const task = indexState.get(key) as Task<OptimizationStateFulfilled>

          return [key, task] as const
        }
      )
    )

  // const selectorTasksRejected = (): Record<
  //   string,
  //   Task<OptimizationStateRejected>
  // > =>
  //   Object.fromEntries(
  //     Array.from(indexState.entries()).filter(
  //       ([_, task]) => task.state.type === TypeOptimizationState.Rejected
  //     )
  //   ) as Record<string, Task<OptimizationStateRejected>>

  const selectorTasksCount = () => {
    return Array.from(indexState.values()).reduce(
      (counts, task) => {
        switch (task.state.type) {
          case TypeOptimizationState.Rejected:
            counts.rejected++
            break
          case TypeOptimizationState.Fulfilled:
            counts.fulfilled++
            break
          case TypeOptimizationState.Pending:
            counts.pending++
        }

        return counts
      },
      {
        pending: 0,
        rejected: 0,
        fulfilled: 0
      }
    )
  }

  const selectorCubes = (): Map<number, Task<OptimizationStateFulfilled>> => {
    const tasks = new Map(Object.entries(selectorTasksFulfilled()))

    return new Map(
      compact(
        Array.from(indexCube.entries()).map(([position, set]) => {
          const key: string | undefined = Array.from(set).filter((key) =>
            tasks.has(key)
          )[0]

          if (key !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const task = tasks.get(key)!

            return [position, task]
          }

          return undefined
        })
      )
    )
  }

  const selectorStats = () => {
    const cubes = Array.from(selectorCubes().entries())
    const cubesRemaining = Array.from(selectorCubes().entries()).length
    const cubesTotal = indexCube.size
    const costs = cubes.map(([_, task]) => task.state.cost)

    const costMin = Math.min(...costs)
    const costMax = Math.max(...costs)
    const costMean = mean(costs)
    const costSd = standardDeviation(costs)

    return {
      cubesRemaining,
      cubesTotal,
      costMin,
      costMax,
      costMean,
      costSd
    }
  }

  const selectorModel = (): Model => {
    const cubes = Array.from(selectorCubes().entries()).map(
      ([position, task]): [number, Array<[number, number, number]>] => {
        return [position, task.state.colors]
      }
    )

    const interval = storeOptions.interval

    return {
      cubes,
      interval
    }
  }

  const state = () => log[0]

  const store = {
    options: storeOptions,
    tasksPending: selectorTasksPending,
    tasksNotPending: selectorTasksNotPending,
    tasksFulfilled: selectorTasksFulfilled,
    tasksCount: selectorTasksCount,
    cubes: selectorCubes,
    stats: selectorStats,
    model: selectorModel,
    state,
    actionUpdateTask,
    actionUpdateStage
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const storeWithEmitter = { ...store } as Pick<
    typeof emitter,
    'on' | 'events' | 'anyEvent' | 'clearListeners'
  > &
    typeof store

  emitter.bindMethods(storeWithEmitter, [
    'on',
    'events',
    'anyEvent',
    'clearListeners'
  ])

  return storeWithEmitter
}
