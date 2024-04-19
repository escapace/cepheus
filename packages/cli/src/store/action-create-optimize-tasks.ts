import { tile } from '@cepheus/utilities'
import { normalizeAngle } from 'cepheus'
import { type OptimizeTaskOptions, TypeOptimizationState } from '../types'
import { hash } from '../utilities/hash'
import { normalizeWeights } from '../utilities/normalize-weights'
import { objectHash } from '../utilities/object-hash'
import { createSquareOptions } from './create-square-options'
import type { Store } from './create-store'

interface Options {
  hueAngle?: number
  squares?: Map<
    number,
    Required<Pick<OptimizeTaskOptions, 'chroma' | 'lightness'>>
  >
  weights?: OptimizeTaskOptions['weights']
}

export function actionCreateOptimizeTasks(
  store: Store,
  iteration: number,
  options: Options = {}
) {
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
        : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          options.squares.get(square)!

    const optimizeTaskOptions: OptimizeTaskOptions = {
      background: store.options.background,
      colors: store.options.colors,
      colorSpace: store.options.colorSpace,
      hueAngle: normalizeAngle(options.hueAngle ?? store.options.hueAngle),
      hyperparameters: store.options.hyperparameters,
      key: hash(square, store.options.interval, store.options.randomSeed),
      randomSeed: hash(
        iteration,
        square,
        store.options.interval,
        store.options.randomSeed
      ),
      randomSource: store.options.randomSource,
      weights:
        options?.weights === undefined
          ? store.options.weights
          : normalizeWeights(options.weights),
      ...squareOptions
    }

    // const options = taskOptionsFrom(square, iteration, storeOptions)
    // @ts-expect-error unable to type JSONType
    const key = objectHash(optimizeTaskOptions)

    if (!store.indexState.has(key)) {
      if (store.indexInitialState.has(key)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        store.indexState.set(key, store.indexInitialState.get(key)!)
      } else {
        store.indexState.set(key, {
          options: optimizeTaskOptions,
          state: {
            type: TypeOptimizationState.Pending
          }
        })
      }
    }

    store.indexSquare.get(square)?.set(iteration, key)
  })
}
