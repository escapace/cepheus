import { convert, fixNaN, OKLCH, parse } from '@cepheus/color'
import { isolate, N, tile, toPosition } from '@cepheus/utilities'
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
  memoize,
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
  OptimizeTask,
  OptimizeTaskOptions,
  RequiredStoreOptions,
  Square,
  StoreOptions,
  Triangle,
  TriangleOptions,
  TriangleTaskResult,
  TypeCepheusState,
  TypeOptimizationState
} from './types'
import { hash } from './utilities/hash'
import { objectHash } from './utilities/object-hash'
import {
  createTriangleOptions,
  TRIANGLE_TASK_BATCH_SIZE
} from './utilities/triangle'

const rangeFrom = (square: Square, interval: number) => {
  const position = toPosition(square, interval)

  const [lightness, chroma] = range(2).map((_, index) => {
    const range = [position[index], position[index] + interval] as [
      number,
      number
    ]

    const target = range[1]

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
  const colors = options.colors.map((colors) =>
    colors.map(
      (value) =>
        fixNaN(
          convert(isString(value) ? parse(value) : value, OKLCH, {
            inGamut: true
          })
        ).coords
    )
  )

  const background = ['#000000', '#030202'].map(
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

  if (!(isInteger(iterations) && iterations >= 1)) {
    throw new Error(`'iterations' must be an integer greater or equal to 1`)
  }

  return {
    ...omit(options, ['levels']),
    background,
    colors,
    interval,
    iterations
  }
}

const optimizeTaskOptionsFrom = (
  square: Square,
  interval: number,
  iteration: number,
  options: RequiredStoreOptions
): OptimizeTaskOptions => ({
  key: hash(square, interval, options.randomSeed),
  randomSeed: hash(iteration, square, interval, options.randomSeed),
  randomSource: options.randomSource,
  colors: options.colors,
  background: options.background,
  colorSpace: options.colorSpace,
  hyperparameters: options.hyperparameters,
  weights: options.weights,
  ...rangeFrom(square, interval)
})

export const createStore = (
  options: StoreOptions,
  initialState: Record<string, OptimizeTask> = {}
) => {
  const log: CepheusState[] = [{ type: TypeCepheusState.Optimization }]

  const storeOptions = normalizeOptions(options)
  const emitter = new Emittery<{
    triangleTask: undefined
    optimizeTask: [string, OptimizeTask]
    state: CepheusState
  }>()

  const interval = storeOptions.interval

  const squares = tile(storeOptions.interval)

  const indexSquare: Map<Square, Map<number, string>> = new Map(
    squares.map((value) => [value, new Map<number, string>()])
  )

  const indexState: Map<string, OptimizeTask> = new Map()

  const triangleTaskResults: TriangleTaskResult[] = []

  const indexInitialState: Map<string, OptimizeTask> = new Map(
    Object.entries(initialState)
  )

  const allIterations = range(storeOptions.iterations)

  const actionCreateOptimizeTasks = (iteration: number) => {
    squares.forEach((square) => {
      const optimizeTaskOptions = optimizeTaskOptionsFrom(
        square,
        interval,
        iteration,
        storeOptions
      )

      // const options = taskOptionsFrom(square, iteration, storeOptions)

      // @ts-expect-error unable to type JSONType
      const key = objectHash(optimizeTaskOptions)

      if (!indexState.has(key)) {
        if (indexInitialState.has(key)) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          indexState.set(key, indexInitialState.get(key)!)
        } else {
          indexState.set(key, {
            options: optimizeTaskOptions,
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

  const actionUpdateOptimizeTask = async (
    key: string,
    state: OptimizationState
  ) => {
    const value = indexState.get(key)

    if (value === undefined) {
      throw new Error('Task key unknown.')
    }

    const task: OptimizeTask = {
      ...value,
      state
    }

    indexState.set(key, task)

    await emitter.emit('optimizeTask', [key, task])
  }

  const actionUpdateStage = async (value: CepheusState) => {
    log.unshift(value)

    await emitter.emit('state', value)
  }

  const selectorOptimizeTasksPending = (): Record<
    string,
    OptimizeTask<OptimizationStatePending>
  > =>
    Object.fromEntries(
      Array.from(indexState.entries()).filter(
        ([_, task]) => task.state.type === TypeOptimizationState.Pending
      )
    ) as Record<string, OptimizeTask<OptimizationStatePending>>
  //
  const selectorOptimizeTasksNotPending = (): Record<string, OptimizeTask> =>
    Object.fromEntries(
      Array.from(indexState.entries()).filter(
        ([_, task]) => task.state.type !== TypeOptimizationState.Pending
      )
    )

  const selectorOptimizeTasksFulfilledAll = (
    iterations: number[]
  ): Record<string, OptimizeTask<OptimizationStateFulfilled>> => {
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
    ) as Record<string, OptimizeTask<OptimizationStateFulfilled>>
  }

  const selectorOptimizeTasksFulfilled = (
    iterations: number[]
  ): Record<string, OptimizeTask<OptimizationStateFulfilled>> =>
    Object.fromEntries(
      map(
        groupBy(
          Object.values(selectorOptimizeTasksFulfilledAll(iterations)),
          (value) => value.options.key
        ),
        (array) => {
          const value = [...array].sort(
            ({ state: { cost: a } }, { state: { cost: b } }) => a - b
          )[0]

          // @ts-expect-error unable to type JSONType
          const key = objectHash(value.options)

          const task = indexState.get(
            key
          ) as OptimizeTask<OptimizationStateFulfilled>

          return [key, task] as const
        }
      )
    )

  const totalOptimzeTasks =
    storeOptions.iterations * Math.pow(N / storeOptions.interval, 2)

  const selectorOptimizeTasksCount = () => {
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
        total: totalOptimzeTasks,
        pending: 0,
        rejected: 0,
        fulfilled: 0
      }
    )
  }

  const selectorSquares = (
    iterations: number[] = allIterations
  ): Map<number, OptimizeTask<OptimizationStateFulfilled>> => {
    const bestTasks = new Map(
      Object.entries(selectorOptimizeTasksFulfilled(iterations))
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
    const squares = Array.from(selectorSquares(allIterations).entries())
    const squaresRemaining = squares.length
    const squaresTotal = indexSquare.size
    const costs = squares.map(([_, task]) => task.state.cost)
    const colors = storeOptions.colors.length

    const costMin = Math.min(...costs)
    const costMax = Math.max(...costs)
    const costMean = mean(costs)
    const costSd = standardDeviation(costs)

    return {
      colors,
      squaresRemaining,
      squaresTotal,
      costMin,
      costMax,
      costMean,
      costSd
    }
  }

  const selectorModel = (precision = 5): Model => {
    const values = new Map(
      Array.from(selectorSquares(allIterations).entries()).map(
        ([square, task]): [number, Array<[number, number, number]>] => {
          return [
            square,
            map(
              task.state.colors,
              (value) =>
                map(value, (value) =>
                  Number.isFinite(precision)
                    ? parseFloat(new BigNumber(value).toPrecision(5))
                    : value
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
    const triangle = selectorTriangle()

    if (triangle === undefined) {
      throw new Error('Triangle fitting failed.')
    }

    const triangleF = triangle.flat() as [
      number,
      number,
      number,
      number,
      number,
      number
    ]

    return [interval, length, triangleF, squares, colors]
  }
  const selectorTriangle = (): Triangle | undefined => {
    const results: Array<Exclude<TriangleTaskResult, undefined>> =
      triangleTaskResults
        .filter(
          (value): value is Exclude<TriangleTaskResult, undefined> =>
            value !== undefined
        )
        .sort((a, b) => b[1] - a[1])

    if (results.length === 0) {
      return undefined
    }

    return results[0][0] as Triangle
  }

  const actionUpdateTriangleTask = async (result: TriangleTaskResult) => {
    triangleTaskResults.push(result)

    await emitter.emit('triangleTask')
  }

  const selectorTriangleOptions = memoize(() => {
    return createTriangleOptions(
      storeOptions.interval,
      Array.from(selectorSquares().keys())
    )
  }) as () => TriangleOptions

  const selectorTriangleTasksCountTotal = memoize(() => {
    const { factors } = selectorTriangleOptions()

    return Math.ceil(
      (factors[0].length * factors[1].length * factors[2].length) /
        TRIANGLE_TASK_BATCH_SIZE
    )
  }) as () => number

  const selectorTriangleTasksCount = () => {
    const total = selectorTriangleTasksCountTotal()
    const rejected =
      triangleTaskResults?.filter((value) => value === undefined).length ?? 0
    const fulfilled = (triangleTaskResults?.length ?? 0) - rejected

    return {
      total,
      rejected,
      fulfilled
    }
  }

  const state = () => log[0]

  const store = {
    actionUpdateOptimizeTask,
    actionUpdateStage,
    actionUpdateTriangleTask,
    actionCreateOptimizeTasks,
    model: selectorModel,
    optimizeTasksCount: selectorOptimizeTasksCount,
    optimizeTasksFulfilled: selectorOptimizeTasksFulfilled,
    optimizeTasksNotPending: selectorOptimizeTasksNotPending,
    optimizeTasksPending: selectorOptimizeTasksPending,
    options: storeOptions,
    squares: selectorSquares,
    state,
    stats: selectorStats,
    triangle: selectorTriangle,
    triangleOptions: selectorTriangleOptions,
    triangleTasksCount: selectorTriangleTasksCount
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
