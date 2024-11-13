import { ColorSpace, normalizeAngle } from 'cepheus'
import {
  ColorSpace as _ColorSpace,
  to as convert,
  HSL,
  HSV,
  LCH,
  OKLab,
  OKLCH,
  P3,
  parse,
  sRGB,
} from 'colorjs.io/fn'
import { isInteger, isString, omit } from 'lodash-es'
import {
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
  _ColorSpace.register(HSL)
  _ColorSpace.register(HSV)
  _ColorSpace.register(P3)
  _ColorSpace.register(OKLab)
  _ColorSpace.register(OKLCH)
  _ColorSpace.register(sRGB)
  _ColorSpace.register(LCH)
  const colors = options.colors.map((colors) =>
    colors.map((value) =>
      fixNaN(
        convert(
          isString(value) ? parse(value) : { alpha: 1, coords: [...value], space: OKLCH },
          OKLCH,
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

  const colorSpace = (options.colorSpace ?? 'p3') === 'p3' ? ColorSpace.p3 : ColorSpace.srgb

  const hueAngle =
    options.hueAngle === undefined ? DEFAULT_HUE_ANGLE : normalizeAngle(options.hueAngle)

  const precision = options.precision ?? DEFAULT_PRECISION

  return {
    ...omit(options, ['levels']),
    colors,
    colorSpace,
    hueAngle,
    interval,
    iterations,
    precision,
    weights: DEFAULT_WEIGHTS,
  }
}
