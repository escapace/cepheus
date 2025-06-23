import { tile } from '@cepheus/utilities'
import { normalizeAngle } from 'cepheus'
import { type OptimizeTaskOptions, type SquareOptions, TypeOptimizationState } from '../types'
import { hash } from '../utilities/hash'
import { normalizeWeights } from '../utilities/normalize-weights'
import { objectHash } from '../utilities/object-hash'
import { createSquareOptions } from './create-square-options'
import type { Store } from './create-store'
import assert from 'node:assert'

interface Options {
  hueAngle?: number
  squares?: Map<number, SquareOptions>
  tolerance?: number
  weights?: OptimizeTaskOptions['weights']
}

export function actionCreateOptimizeTasks(store: Store, iteration: number, options: Options = {}) {
  const squares =
    options.squares === undefined
      ? tile(store.options.interval)
      : Array.from(options.squares.keys())

  squares.forEach((square) => {
    store.indexSquare.set(square, new Map<number, string>())
  })

  squares.forEach((square) => {
    const squareOptions =
      options.squares === undefined
        ? createSquareOptions(square, store.options.interval)
        : options.squares.get(square)

    if (squareOptions === undefined) {
      return
    }

    const colors =
      squareOptions.colors === undefined
        ? store.options.colors
        : store.options.colors.map((color, index) =>
            // eslint-disable-next-line typescript/no-non-null-assertion
            squareOptions.colors!.includes(index) ? color : null,
          )

    assert(
      colors.length !== 0 && !colors.every((value) => value === undefined || value === null),
      'empty colors array',
    )

    const optimizeTaskOptions: OptimizeTaskOptions = {
      ...squareOptions,
      colorGamut: store.options.colorGamut,
      colors,
      colorSpace: store.options.colorSpace,
      deltaE: store.options.deltaE,
      hueAngle: normalizeAngle(options.hueAngle ?? store.options.hueAngle),
      hyperparameters: store.options.hyperparameters,
      key: hash(square, store.options.interval, store.options.randomSeed),
      randomSeed: hash(iteration, square, store.options.interval, store.options.randomSeed),
      randomSource: store.options.randomSource,
      tolerance: options.tolerance ?? 1,
      weights:
        options?.weights === undefined ? store.options.weights : normalizeWeights(options.weights),
    }

    // const options = taskOptionsFrom(square, iteration, storeOptions)
    // @ts-expect-error unable to type JSONType
    const key = objectHash(optimizeTaskOptions)

    if (!store.indexState.has(key)) {
      if (store.indexInitialState.has(key)) {
        // eslint-disable-next-line typescript/no-non-null-assertion
        store.indexState.set(key, store.indexInitialState.get(key)!)
      } else {
        store.indexState.set(key, {
          options: optimizeTaskOptions,
          state: {
            type: TypeOptimizationState.Pending,
          },
        })
      }
    }

    store.indexSquare.get(square)?.set(iteration, key)
  })
}
