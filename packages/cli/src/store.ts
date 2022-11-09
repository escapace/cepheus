import { convert, fixNaN, OKLCH, parse } from '@cepheus/color'
import Emittery from 'emittery'
import {
  compact,
  difference,
  groupBy,
  isInteger,
  isString,
  map,
  omit,
  range,
  uniq
} from 'lodash-es'
import { mean, standardDeviation } from 'simple-statistics'
import {
  CepheusState,
  Square,
  Model,
  OptimizationState,
  OptimizationStateFulfilled,
  OptimizationStatePending,
  RequiredStoreOptions,
  StoreOptions,
  Task,
  TaskOptions,
  TypeCepheusState,
  TypeOptimizationState
} from './types'
import { cartesianProduct, szudzik, unszudzik } from '@cepheus/utilities'
import { hash } from './utilities/hash'
import { objectHash } from './utilities/object-hash'
import {
  DEFAULT_OPTIMIZE_RANGE_DIVISOR,
  DEFAULT_ITERATIONS,
  OPTIMIZE_RANGE_DIVISORS,
  OPTIMIZE_RANGE_MAX
} from './constants'

const fromXYZ = (value: number[], interval: number): number =>
  szudzik(...value.map((v) => v / interval))

const toXYZ = (square: Square): [number, number] =>
  unszudzik(square.position, 2).map((v) => v * square.interval) as [
    number,
    number
  ]

const tile = (interval: number): Square[] => {
  const distribution = range(0, OPTIMIZE_RANGE_MAX, interval)

  return cartesianProduct(distribution, distribution).map(
    (value): Square => ({
      interval,
      position: fromXYZ(value as [number, number], interval)
    })
  )
}

const rangeFrom = (square: Square) => {
  const positions = toXYZ(square)

  const [lightness, chroma] = range(2).map((_, index) => {
    const range = [positions[index], positions[index] + square.interval] as [
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
    chroma
  }
}

const surroundingSquares = (square: Square): Square[] => {
  const [xs, ys] = toXYZ(square)
  const i = square.interval

  // y
  // |
  // |  nw  n  ne
  // |  w   !   e
  // |  sw  s  se
  // |
  // +------------x

  const n = [xs, ys + i]
  const ne = [xs + i, ys + i]
  const e = [xs + i, ys]
  const se = [xs + i, ys - i]
  const s = [xs, ys - i]
  const sw = [xs - i, ys - i]
  const w = [xs - i, ys]
  const nw = [xs - i, ys + i]

  return [n, ne, e, se, s, sw, w, nw]
    .filter(([x, y]) => x >= 0 && y >= 0)
    .map((position) => ({
      position: fromXYZ(position, i),
      interval: i
    }))
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

  const background = options.background.map(
    (value) =>
      fixNaN(
        convert(isString(value) ? parse(value) : value, OKLCH, {
          inGamut: true
        })
      ).coords
  )

  const interval =
    OPTIMIZE_RANGE_MAX / (options.levels ?? DEFAULT_OPTIMIZE_RANGE_DIVISOR)
  const iterations = options.iterations ?? DEFAULT_ITERATIONS

  if (!OPTIMIZE_RANGE_DIVISORS.includes(interval)) {
    throw new Error(
      `'levels' must be one of ${OPTIMIZE_RANGE_DIVISORS.join(', ')}`
    )
  }

  if (!(isInteger(iterations) && iterations >= 2 && iterations % 2 === 0)) {
    throw new Error(
      `'iterations' must be an even integer greater or equal to 2`
    )
  }

  return {
    ...omit(options, ['levels']),
    background,
    colors,
    interval,
    iterations
  }
}

const taskOptionsFrom = (
  square: Square,
  iteration: number,
  options: RequiredStoreOptions,
  colorsPrevious?: Array<[number, number, number]>,
  colorsSurrounding?: Array<Array<[number, number, number]>>
): TaskOptions => ({
  key: hash(square.position, square.interval, options.randomSeed),
  randomSeed: hash(
    iteration,
    square.position,
    square.interval,
    options.randomSeed
  ),
  randomSource: options.randomSource,
  colors: options.colors,
  background: options.background,
  colorSpace: options.colorSpace,
  hyperparameters: options.hyperparameters,
  weights: options.weights,
  colorsSurrounding,
  colorsPrevious,
  ...rangeFrom(square)
})

export const createStore = (
  options: StoreOptions,
  initialState: Record<string, Task> = {}
) => {
  const log: CepheusState[] = [{ type: TypeCepheusState.None }]

  const storeOptions = normalizeOptions(options)
  const emitter = new Emittery<{
    task: [string, Task]
    state: CepheusState
  }>()

  const squares = tile(storeOptions.interval)

  const indexSquare: Map<number, Map<number, string>> = new Map(
    squares.map((value) => [value.position, new Map<number, string>()])
  )

  const indexState: Map<string, Task> = new Map()

  const indexInitialState: Map<string, Task> = new Map(
    Object.entries(initialState)
  )

  const iterations = range(storeOptions.iterations)
  const iterationsFirst = iterations.slice(0, iterations.length / 2)
  const iterationsLast = difference(iterations, iterationsFirst)

  let iteratedSquares: Map<number, Task<OptimizationStateFulfilled>>

  const iterate = (iteration: number) => {
    if (iteration === iterationsLast[0]) {
      iteratedSquares = selectorSquares(iterationsFirst)
    }

    squares.forEach((square) => {
      let options: TaskOptions

      if (iterationsLast.includes(iteration)) {
        const colorsPrevious =
          iteratedSquares.get(square.position)?.state.colors ?? []
        const colorsSurrounding = compact(
          surroundingSquares(square).map(
            (square) => iteratedSquares.get(square.position)?.options.colors
          )
        )

        options = taskOptionsFrom(
          square,
          iteration,
          storeOptions,
          colorsPrevious,
          colorsSurrounding
        )
      } else {
        options = taskOptionsFrom(square, iteration, storeOptions)
      }

      // const options = taskOptionsFrom(square, iteration, storeOptions)

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

      indexSquare.get(square.position)?.set(iteration, key)
    })
  }

  // select the best iteration in preflight

  // const selectorTasksBySquare = (square: Square) => {
  //   const keys = indexSquare.get(square.position)
  //
  //   if (keys === undefined) {
  //     return []
  //   }
  //
  //   const qwe = Array.from(keys).map(key => indexState.get(key))
  // }

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

  const actionUpdateStage = async (value: CepheusState) => {
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

  const selectorTasksFulfilledAll = (
    iterations: number[]
  ): Record<string, Task<OptimizationStateFulfilled>> => {
    const keys = uniq(
      Array.from(indexSquare.values()).flatMap((iterationsMap) => {
        return compact(
          iterations.map((iteration) => iterationsMap.get(iteration))
        )
      })
    )

    return Object.fromEntries(
      Array.from(indexState.entries()).filter(
        ([key, task]) =>
          keys.includes(key) &&
          task.state.type === TypeOptimizationState.Fulfilled
      )
    ) as Record<string, Task<OptimizationStateFulfilled>>
  }

  const selectorTasksFulfilled = (
    iterations: number[]
  ): Record<string, Task<OptimizationStateFulfilled>> =>
    Object.fromEntries(
      map(
        groupBy(
          Object.values(selectorTasksFulfilledAll(iterations)),
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

  const selectorSquares = (
    iterations: number[] = iterationsLast
  ): Map<number, Task<OptimizationStateFulfilled>> => {
    const bestTasks = new Map(
      Object.entries(selectorTasksFulfilled(iterations))
    )

    return new Map(
      compact(
        Array.from(indexSquare.entries()).map(([position, iterationsMap]) => {
          const keys = compact(
            iterations.map((iteration) => iterationsMap.get(iteration))
          )

          const key: string | undefined = keys.filter((key) =>
            bestTasks.has(key)
          )[0]

          if (key !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const task = bestTasks.get(key)!

            return [position, task]
          }

          return undefined
        })
      )
    )
  }

  const selectorStats = () => {
    const squares = Array.from(selectorSquares(iterationsLast).entries())
    const squaresRemaining = squares.length
    const squaresTotal = indexSquare.size
    const costs = squares.map(([_, task]) => task.state.cost)

    const costMin = Math.min(...costs)
    const costMax = Math.max(...costs)
    const costMean = mean(costs)
    const costSd = standardDeviation(costs)

    return {
      squaresRemaining,
      squaresTotal,
      costMin,
      costMax,
      costMean,
      costSd
    }
  }

  const selectorModel = (): Model => {
    const squares = Array.from(selectorSquares(iterationsLast).entries()).map(
      ([position, task]): [number, Array<[number, number, number]>] => {
        return [position, task.state.colors]
      }
    )

    const interval = storeOptions.interval

    return {
      squares,
      interval
    }
  }

  const state = () => log[0]

  const store = {
    actionUpdateStage,
    actionUpdateTask,
    iterate,
    model: selectorModel,
    options: storeOptions,
    squares: selectorSquares,
    state,
    stats: selectorStats,
    tasksCount: selectorTasksCount,
    tasksFulfilled: selectorTasksFulfilled,
    tasksNotPending: selectorTasksNotPending,
    tasksPending: selectorTasksPending
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
