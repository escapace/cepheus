import { convert, fixNaN, OKLCH, parse } from '@cepheus/color'
import { N } from '@cepheus/utilities'
import { isInteger, isString, omit } from 'lodash-es'
import { DEFAULT_ITERATIONS, DEFAULT_N_DIVISOR, N_DIVISORS } from '../constants'
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

  return {
    ...omit(options, ['levels']),
    background,
    colors,
    interval,
    iterations
  }
}
