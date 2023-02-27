import { OptimizeTaskOptions, RequiredStoreOptions, Square } from '../types'
import { hash } from '../utilities/hash'
import { createSquareOptions } from './create-square-options'

export function createOptimizeTaskOptions(
  square: Square,
  interval: number,
  iteration: number,
  options: RequiredStoreOptions
): OptimizeTaskOptions {
  return {
    key: hash(square, interval, options.randomSeed),
    randomSeed: hash(iteration, square, interval, options.randomSeed),
    randomSource: options.randomSource,
    colors: options.colors,
    background: options.background,
    colorSpace: options.colorSpace,
    hyperparameters: options.hyperparameters,
    weights: options.weights,
    ...createSquareOptions(square, interval)
  }
}
