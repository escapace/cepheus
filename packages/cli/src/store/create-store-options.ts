import { convert, fixNaN, OKLCH, parse } from '@cepheus/color'
import { ColorSpace, normalizeAngle } from 'cepheus'
import { isInteger, isString, omit } from 'lodash-es'
import {
  DEFAULT_HUE_ANGLE,
  DEFAULT_ITERATIONS,
  DEFAULT_N_DIVISOR,
  DEFAULT_WEIGHTS,
  N,
  N_DIVISORS
} from '../constants'
import { RequiredStoreOptions, StoreOptions } from '../types'

export function createStoreOptions(
  options: StoreOptions
): RequiredStoreOptions {
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

  const colorSpace =
    (options.colorSpace ?? 'p3') === 'p3' ? ColorSpace.p3 : ColorSpace.srgb

  const hueAngle =
    options.hueAngle === undefined
      ? DEFAULT_HUE_ANGLE
      : normalizeAngle(options.hueAngle)

  const precision = options.precision ?? 5

  return {
    ...omit(options, ['levels']),
    hueAngle,
    precision,
    weights: DEFAULT_WEIGHTS,
    colorSpace,
    background,
    colors,
    interval,
    iterations
  }
}
