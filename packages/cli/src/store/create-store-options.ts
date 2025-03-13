import { normalizeAngle } from 'cepheus'
import { to as convert, OKLCH, OKLrCH, parse } from 'colorjs.io/fn'
import { isInteger, isString, omit } from 'lodash-es'
import {
  DEFAULT_DELTA_E,
  DEFAULT_HUE_ANGLE,
  DEFAULT_ITERATIONS,
  DEFAULT_N_DIVISOR,
  DEFAULT_PRECISION,
  DEFAULT_WEIGHTS,
  N,
  N_DIVISORS,
} from '../constants'
import type { RequiredStoreOptions, StoreOptions } from '../types'
import { fixNaN } from '../utilities/fix-nan'

export function createStoreOptions(options: StoreOptions): RequiredStoreOptions {
  const colorSpace = options.colorSpace ?? 'oklrch'

  const colors = options.colors.map((colors) =>
    colors.map((value) =>
      fixNaN(
        convert(
          isString(value) ? parse(value) : { alpha: 1, coords: [...value], space: OKLCH },
          colorSpace === 'oklch' ? OKLCH : OKLrCH,
          {
            inGamut: true,
          },
        ).coords,
      ),
    ),
  )

  const interval = N / (options.levels ?? DEFAULT_N_DIVISOR)
  const iterations = options.iterations ?? DEFAULT_ITERATIONS

  if (!N_DIVISORS.includes(interval)) {
    throw new Error(`'levels' must be one of ${N_DIVISORS.join(', ')}`)
  }

  if (!(isInteger(iterations) && iterations >= 1)) {
    throw new Error(`'iterations' must be an integer greater or equal to 1`)
  }

  const colorGamut = options.colorGamut ?? 'p3'

  const hueAngle =
    options.hueAngle === undefined ? DEFAULT_HUE_ANGLE : normalizeAngle(options.hueAngle)

  const precision = options.precision ?? DEFAULT_PRECISION
  const deltaE = options.deltaE ?? DEFAULT_DELTA_E

  return {
    ...omit(options, ['levels']),
    colorGamut,
    colors,
    colorSpace,
    deltaE,
    hueAngle,
    interval,
    iterations,
    precision,
    weights: DEFAULT_WEIGHTS,
  }
}
