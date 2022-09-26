import { Color, convert, OKLCH, parse } from '@escapace/bruni-color'
import { isInteger, isString, omit, range } from 'lodash-es'
import {
  OptimizationState,
  OptimizeOptions,
  TypeOptimizationState
} from './optimize'
import { cartesianProduct } from './utilities/cartesian-product'
import { fixNaN } from './utilities/fix-nan'
import { hash } from './utilities/hash'
import { objectHash } from './utilities/object-hash'
import { szudzik, unszudzik } from './utilities/szudzik'
import Emittery from 'emittery'

export type INTERVAL = 2 | 4 | 5 | 10 | 20 | 25 | 50

interface Cube {
  interval: INTERVAL
  position: number
}

const fromXYZ = (value: [number, number, number]): number => szudzik(...value)
const toXYZ = (value: number): [number, number, number] =>
  unszudzik(value, 3) as [number, number, number]

export const cubeVolume = (cube: Cube) => Math.pow(cube.interval, 3)

export const cubeVertices = (cube: Cube) => {
  const [x, y, z] = toXYZ(cube.position)

  return cartesianProduct(
    [x, cube.interval + x],
    [y, cube.interval + y],
    [z, cube.interval + z]
  ) as [
    [number, number, number],
    [number, number, number],
    [number, number, number],
    [number, number, number],
    [number, number, number],
    [number, number, number],
    [number, number, number],
    [number, number, number]
  ]
  /*   .map((value) => fromXYZ(value as [number, number, number])) as [ */
  /*   number, */
  /*   number, */
  /*   number */
  /* ] */
}

export const tile = (interval: INTERVAL = 50): Cube[] => {
  const distribution = range(0, 100, interval)

  return cartesianProduct(distribution, distribution, distribution).map(
    (value): Cube => ({
      interval,
      position: fromXYZ(value as [number, number, number])
    })
  )
}

export const rangeFrom = (cube: Cube) => {
  return cubeVertices(cube).map((value) => {
    const [lightness, chroma, contrast] = value.map((target) => {
      const range = [
        Math.max(0, target - cube.interval / 2),
        Math.min(100, target + cube.interval / 2)
      ] as [number, number]

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
  })
}

export interface StoreOptions
  extends Omit<
    OptimizeOptions,
    'colors' | 'background' | 'lightness' | 'chroma' | 'contrast'
  > {
  colors: Color[] | string[]
  background: Color | string
  levels?: INTERVAL
  tries?: number
}

export interface RequiredStoreOptions
  extends Omit<StoreOptions, 'colors' | 'background' | 'levels'> {
  colors: Array<[number, number, number]>
  background: [number, number, number]
  interval: INTERVAL
  tries: number
}

export const normalizeOptions = (
  options: StoreOptions
): RequiredStoreOptions => {
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

  const interval = (100 / (options.levels ?? 2)) as INTERVAL
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

const optionsFrom = (
  cube: Cube,
  options: RequiredStoreOptions,
  n = 0
): OptimizeOptions[] =>
  rangeFrom(cube).map((value) => ({
    randomSeed: hash(n, cube.position, cube.interval, options.randomSeed),
    randomSource: options.randomSource,
    colors: options.colors,
    background: options.background,
    colorSpace: options.colorSpace,
    hyperparameters: options.hyperparameters,
    weights: options.weights,
    ...value
  }))

export interface Task {
  state: OptimizationState
  options: OptimizeOptions
}

export const createStore = (
  options: StoreOptions,
  initialState: Record<string, Task> = {}
) => {
  const storeOptions = normalizeOptions(options)
  const emitter = new Emittery<{
    updateTask: [string, Task]
  }>()

  const cubes = tile(storeOptions.interval)

  const indexCube: Map<
    Cube,
    [
      Set<string>,
      Set<string>,
      Set<string>,
      Set<string>,
      Set<string>,
      Set<string>,
      Set<string>,
      Set<string>
    ]
  > = new Map(
    cubes.map((value) => [
      value,
      [
        new Set(),
        new Set(),
        new Set(),
        new Set(),
        new Set(),
        new Set(),
        new Set(),
        new Set()
      ]
    ])
  )

  const indexState: Map<string, Task> = new Map()
  const indexInitialState: Map<string, Task> = new Map(
    Object.entries(initialState)
  )

  cubes.forEach((cube) => {
    range(storeOptions.tries).forEach((n) => {
      optionsFrom(cube, storeOptions, n).forEach((options, index) => {
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

        indexCube.get(cube)?.[index].add(key)
      })
    })
  })

  const updateTask = async (key: string, state: OptimizationState) => {
    const value = indexState.get(key)

    if (value === undefined) {
      throw new Error('Task key unknown.')
    }

    const task: Task = {
      ...value,
      state
    }

    indexState.set(key, task)

    await emitter.emit('updateTask', [key, task])
  }

  const selectorTasksPending = (): Record<string, Task> =>
    Object.fromEntries(
      Array.from(indexState.entries()).filter(
        ([_, task]) => task.state.type === TypeOptimizationState.Pending
      )
    )

  const selectorTasksNotPending = (): Record<string, Task> =>
    Object.fromEntries(
      Array.from(indexState.entries()).filter(
        ([_, task]) => task.state.type !== TypeOptimizationState.Pending
      )
    )

  const selectorTasksFulfilled = (): Record<string, Task> =>
    Object.fromEntries(
      Array.from(indexState.entries()).filter(
        ([_, task]) => task.state.type === TypeOptimizationState.Fulfilled
      )
    )

  const selectorTasksRejected = (): Record<string, Task> =>
    Object.fromEntries(
      Array.from(indexState.entries()).filter(
        ([_, task]) => task.state.type === TypeOptimizationState.Rejected
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

  const store = {
    options: storeOptions,
    tasksPending: selectorTasksPending,
    tasksNotPending: selectorTasksNotPending,
    tasksFulfilled: selectorTasksFulfilled,
    tasksRejected: selectorTasksRejected,
    tasksCount: selectorTasksCount,
    updateTask
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
