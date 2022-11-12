import { convert, fixNaN, OKLCH, parse } from '@cepheus/color'
import { isolate, N, neighbours, tile, toPosition } from '@cepheus/utilities'
import { BigNumber } from 'bignumber.js'
import Emittery from 'emittery'
import {
  compact,
  difference,
  flattenDeep,
  groupBy,
  isInteger,
  isString,
  map,
  omit,
  range,
  uniq
} from 'lodash-es'
import { mean, standardDeviation } from 'simple-statistics'
import { DEFAULT_ITERATIONS, DEFAULT_N_DIVISOR, N_DIVISORS } from './constants'
import {
  CepheusState,
  Model,
  OptimizationState,
  OptimizationStateFulfilled,
  OptimizationStatePending,
  RequiredStoreOptions,
  Square,
  StoreOptions,
  Task,
  TaskOptions,
  TypeCepheusState,
  TypeOptimizationState
} from './types'
import { hash } from './utilities/hash'
import { objectHash } from './utilities/object-hash'

const rangeFrom = (square: Square, interval: number) => {
  const position = toPosition(square, interval)

  const [lightness, chroma] = range(2).map((_, index) => {
    const range = [position[index], position[index] + interval] as [
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

  const interval = N / (options.levels ?? DEFAULT_N_DIVISOR)
  const iterations = options.iterations ?? DEFAULT_ITERATIONS

  if (!N_DIVISORS.includes(interval)) {
    throw new Error(`'levels' must be one of ${N_DIVISORS.join(', ')}`)
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
  interval: number,
  iteration: number,
  options: RequiredStoreOptions,
  colorsPrevious?: Array<[number, number, number]>,
  colorsSurrounding?: Array<Array<[number, number, number]>>
): TaskOptions => ({
  key: hash(square, interval, options.randomSeed),
  randomSeed: hash(iteration, square, interval, options.randomSeed),
  randomSource: options.randomSource,
  colors: options.colors,
  background: options.background,
  colorSpace: options.colorSpace,
  hyperparameters: options.hyperparameters,
  weights: options.weights,
  colorsSurrounding,
  colorsPrevious,
  ...rangeFrom(square, interval)
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

  const interval = storeOptions.interval

  const squares = tile(storeOptions.interval)

  const indexSquare: Map<Square, Map<number, string>> = new Map(
    squares.map((value) => [value, new Map<number, string>()])
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
        const colorsPrevious = iteratedSquares.get(square)?.state.colors ?? []
        const colorsSurrounding = compact(
          neighbours(square, interval, true).map(
            (square) => iteratedSquares.get(square)?.options.colors
          )
        )

        options = taskOptionsFrom(
          square,
          interval,
          iteration,
          storeOptions,
          colorsPrevious,
          colorsSurrounding
        )
      } else {
        options = taskOptionsFrom(square, interval, iteration, storeOptions)
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

      indexSquare.get(square)?.set(iteration, key)
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

    const result = new Map(
      compact(
        Array.from(indexSquare.entries()).map(([square, iterationsMap]) => {
          const keys = compact(
            iterations.map((iteration) => iterationsMap.get(iteration))
          )

          const key: string | undefined = keys.filter((key) =>
            bestTasks.has(key)
          )[0]

          if (key !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const task = bestTasks.get(key)!

            return [square, task]
          }

          return undefined
        })
      )
    )

    const squares = Array.from(result.keys())

    difference(squares, isolate(squares, interval, false)[0]).forEach(
      (square) => result.delete(square)
    )

    return result
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
    const values = new Map(
      Array.from(selectorSquares(iterationsLast).entries()).map(
        ([square, task]): [number, Array<[number, number, number]>] => {
          return [
            square,
            map(
              task.state.colors,
              (value) =>
                map(value, (value) =>
                  parseFloat(new BigNumber(value).toPrecision(5))
                ) as [number, number, number]
            )
          ]
        }
      )
    )

    const interval = storeOptions.interval
    const length = storeOptions.colors.length
    const squares = Array.from(values.keys())
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const colors = flattenDeep(squares.map((square) => values.get(square)!))

    return [interval, length, squares, colors]
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
