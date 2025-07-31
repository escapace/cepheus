import { type Deficiency, simulate as simulateDeficiency } from '@bjornlu/colorblind'
import { clamp, expandRange, isWithin } from '@cepheus/utilities'
import { normalizeAngle } from 'coastal'
import {
  type Coords,
  type PlainColorObject,
  to as convert,
  deltaEJz,
  deltaEOK2,
  OKLCH,
  OKLrCH,
  P3,
  sRGB,
  to,
  toGamutCSS,
} from 'colorjs.io/fn'
import { mean, sample, standardDeviation } from 'simple-statistics'
import { SIDE_LENGTH } from '../constants'
import type { Color, OptimizeOptions, RequiredOptimizeOptions } from '../types'
import { createPRNG } from '../utilities/create-prng'
import { fixNaN } from '../utilities/fix-nan'
import { isColor } from '../utilities/is-color'
import { percentile } from '../utilities/percentile'
import { randomWithin } from '../utilities/random-within'

const normalizeLightness = (
  value: Required<Exclude<OptimizeOptions['lightness'], undefined>>,
  tolerance: number,
): Required<Exclude<OptimizeOptions['lightness'], undefined>> => ({
  range: expandRange(
    value.range.map((value) => value / SIDE_LENGTH) as [number, number],
    tolerance - 1,
  ),
  target: value.target / SIDE_LENGTH,
})

const normalizeChroma = (
  value: Required<Exclude<OptimizeOptions['chroma'], undefined>>,
  tolerance: number,
): Required<Exclude<OptimizeOptions['chroma'], undefined>> => ({
  range: expandRange(
    value.range.map((v) => (v / SIDE_LENGTH) * 0.4) as [number, number],
    tolerance - 1,
  ),
  target: (value.target / SIDE_LENGTH) * 0.4,
})

const createDistanceFunction = (options: OptimizeOptions) => {
  const space = options.colorSpace === 'oklch' ? OKLCH : OKLrCH

  // JzCzhz is a preferred color model for distance calculation due to its strong perceptual uniformity
  // and ability to maintain color accuracy over a wide luminance range, making it particularly effective
  // for handling high-dynamic-range (HDR) and wide color gamut (WCG) applications. This model is
  // designed to approximate human visual perception more closely, especially across different brightness
  // levels, allowing for more consistent and meaningful distance measurements between colors as
  // perceived by the human eye. The JzCzhz color space also simplifies gamut mapping operations, which
  // supports efficient processing when calculating color differences, making it a reliable choice for
  // applications requiring accurate color comparison and differentiation across diverse viewing
  // conditions.
  //
  // The maximum possible value for deltaEJz is determined by analyzing how the individual components
  // of the color difference formula interact. The lightness difference (ΔJ) can reach up to 1, as
  // lightness values range between 0 and 1. The hue difference (ΔH) depends on chroma values: to
  // maximize it, both colors must have maximum chroma (1), but this forces their chroma difference
  // (ΔC) to zero. Conversely, achieving the maximum chroma difference (ΔC = 1) requires one chroma to
  // be 0, which eliminates the hue difference (ΔH = 0). Thus, the largest combined contribution
  // occurs when ΔJ is maximized (1) alongside the largest achievable ΔH (2), calculated using the
  // formula for hue difference. Squaring and summing these values (1² + 2² = 5) and taking the square
  // root yields the theoretical upper bound of √5 (~2.236), ensuring mutual exclusivity of maxima
  // between ΔC and ΔH due to shared dependencies.

  const distanceEJzColorOjbect = (a: PlainColorObject, b: PlainColorObject) => {
    const value = deltaEJz(a, b) / (options.colorGamut === 'srgb' ? 0.34 : 0.37)

    return isNaN(value) ? 1 : value
  }
  const distanceEJz = (a: Color, b: Color) =>
    distanceEJzColorOjbect({ alpha: 1, coords: a, space }, { alpha: 1, coords: b, space })

  const distanceEOK2ColorOjbect = (a: PlainColorObject, b: PlainColorObject) =>
    deltaEOK2(a, b) / (options.colorGamut === 'srgb' ? 1.3 : 1.5)
  const distanceEOK2 = (a: Color, b: Color) =>
    distanceEOK2ColorOjbect({ alpha: 1, coords: a, space }, { alpha: 1, coords: b, space })

  return options.deltaE === 'jzczhz'
    ? {
        distance: distanceEJz,
        distanceColorOjbect: distanceEJzColorOjbect,
      }
    : {
        distance: distanceEOK2,
        distanceColorOjbect: distanceEOK2ColorOjbect,
      }
}

export const normalizeOptions = (options: OptimizeOptions): RequiredOptimizeOptions => {
  const prng = createPRNG(options.randomSeed, options.randomSource)

  const hueAngle = normalizeAngle(options.hueAngle)
  const tolerance = options.tolerance ?? 1

  // eslint-disable-next-line typescript/consistent-type-assertions
  const value = {
    ...createDistanceFunction(options),
    chroma: normalizeChroma(
      {
        range: [0, SIDE_LENGTH],
        target: mean(options.chroma?.range ?? [0, SIDE_LENGTH]),
        ...options.chroma,
      },
      tolerance,
    ),
    colorGamut: options.colorGamut,
    colors: options.colors,
    colorSpace: options.colorSpace === 'oklch' ? OKLCH : OKLrCH,
    costs: {},
    deltaE: options.deltaE,
    hueAngle: hueAngle * tolerance,
    hyperparameters: {
      /* Total number of proposal steps to plan for. */
      iterations: 20_000,
      /* Target probability of accepting a worse move at the final step. */
      acceptanceProbabilityTarget: 0.01,
      /* Fraction of the run that determines the EMA time constant. */
      movingAverageWindowRatio: 0.01,
      /* Winsorisation factor that limits the influence of large |Δcost| spikes. */
      movingAverageWeightClippingFactor: 3,

      ...options.hyperparameters,
    },
    lightness: normalizeLightness(
      {
        range: [0, SIDE_LENGTH],
        target: mean(options.lightness?.range ?? [0, SIDE_LENGTH]),
        ...options.lightness,
      },
      tolerance,
    ),
    prng,
    tolerance: options.tolerance,
    weights: options.weights,
  } as RequiredOptimizeOptions

  if (__ENVIRONMENT__ !== 'production') {
    ;(['lightness', 'chroma'] as const).forEach((key) => {
      if (!isWithin(value[key].target, value[key].range[0], value[key].range[1])) {
        throw new Error(
          `${key} out of range: ${JSON.stringify([
            value[key].target,
            value[key].range[0],
            value[key].range[1],
          ])} ${JSON.stringify(options[key])}`,
        )
      }
    })
  }

  return value
}

export class IterationError extends Error {
  constructor(message: string) {
    super(message)

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, IterationError.prototype)
  }
}

/*
 * Calculates the (0 to 1) normalized coefficient of variation (CV)
 * of consecutive differences in a sorted list of numbers in [0,1].
 *
 * Steps:
 *   1. Compute diffs[i] = x[i+1] - x[i].
 *   2. CV = std(diffs) / mean(diffs).
 *   3. Normalize by dividing by sqrt(diffs.length - 1)
 *      (which equals sqrt(n - 2) for original array length n).
 *
 * The result is guaranteed to be <= 1, with 0 indicating perfectly
 * consistent spacing and 1 indicating the maximum possible inconsistency.
 *
 * @param x - Sorted array of numbers in [0,1] (length >= 2)
 * @returns The normalized CV in [0,1], or NaN if invalid.
 */
export function normalizedCVD(x: number[]): number {
  if (__ENVIRONMENT__ !== 'production' && x.length < 2) {
    // return 1
    throw new Error(`Need at least 2 points to form a difference, got ${x.join(', ')}`)
  }

  // 1. Compute consecutive differences
  const diffs = x.slice(1).map((value, index) => value - x[index])

  // 2. Compute mean of differences
  const avgDiff = mean(diffs)

  // Avoid dividing by zero if the mean difference is 0
  if (avgDiff === 0) {
    return 1
  }

  // 3. Compute standard deviation (sample-based by default in simple-statistics)
  const stdDiff = standardDeviation(diffs)

  // 4. CV of diffs = stdDiff / avgDiff
  const cvDiffs = stdDiff / avgDiff

  // 5. Normalize by dividing by sqrt((n-1) - 1) = sqrt(diffs.length - 1).
  const denom = Math.sqrt(diffs.length - 1)

  if (denom === 0) {
    // This could happen if x.length = 2 => diffs.length = 1 => sqrt(0).
    return 1
  }

  return cvDiffs / denom
}

const floatToByte = (value: number) => clamp(Math.round(255 * value), 0, 255)

export const distances = (
  colors: Color[],
  options: RequiredOptimizeOptions,
  deficiency?: Deficiency,
): number[] => {
  const distances: number[] = []

  const convertedColors = colors.map((color): PlainColorObject => {
    if (deficiency === undefined) {
      return { alpha: 1, coords: color, space: options.colorSpace }
    }

    const sRGBColor = fixNaN(
      convert({ alpha: 1, coords: color, space: options.colorSpace }, sRGB, {
        inGamut: { method: 'css', space: sRGB },
      }).coords,
    )

    if (__ENVIRONMENT__ !== 'production' && !isColor(sRGBColor)) {
      throw new TypeError(`${deficiency} outputs incorrect color`)
    }

    const { b, g, r } = simulateDeficiency(
      {
        b: floatToByte(sRGBColor[2]),
        g: floatToByte(sRGBColor[1]),
        r: floatToByte(sRGBColor[0]),
      },
      deficiency,
    )

    if (__ENVIRONMENT__ !== 'production' && (isNaN(r) || isNaN(g) || isNaN(b))) {
      throw new TypeError(`${deficiency} outputs NaN`)
    }

    return {
      alpha: 1,
      coords: [r, g, b].map((value) => value / 255) as [number, number, number],
      space: sRGB,
    }
  })

  for (let index = 0; index < colors.length; index++) {
    for (let index_ = index + 1; index_ < colors.length; index_++) {
      distances.push(options.distanceColorOjbect(convertedColors[index], convertedColors[index_]))
    }
  }

  if (__ENVIRONMENT__ !== 'production' && distances.includes(NaN)) {
    throw new Error('NaN in distances')
  }

  return distances
}

const randomColorOneShot = (options: RequiredOptimizeOptions, color: Color): Color => [
  randomWithin(options.lightness.range[0], options.lightness.range[1], options.prng),
  randomWithin(options.chroma.range[0], options.chroma.range[1], options.prng),
  normalizeAngle(
    randomWithin(color[2] - options.hueAngle / 2, color[2] + options.hueAngle / 2, options.prng),
  ),
]

const randomColorIterative = (
  options: RequiredOptimizeOptions,
  temperature: number,
  referenceColor: Color,
  accumulator: Color,
) => {
  const index = sample([0, 1, 2], 1, () => options.prng.float())[0]
  const [lightess, chroma, hue] = accumulator

  const percentage = 0.05 + 0.95 * temperature

  switch (index) {
    case 0:
      accumulator[index] = percentile(
        lightess,
        percentage,
        options.lightness.range[0],
        options.lightness.range[1],
        options.prng,
      )

      break
    case 1:
      accumulator[index] = percentile(
        chroma,
        percentage,
        options.chroma.range[0],
        options.chroma.range[1],
        options.prng,
      )

      break
    case 2:
      accumulator[index] = normalizeAngle(
        percentile(
          hue,
          percentage,
          referenceColor[2] - options.hueAngle / 2,
          referenceColor[2] + options.hueAngle / 2,
          options.prng,
        ),
      )

      break
  }

  return accumulator
}

export function randomColor(
  options: RequiredOptimizeOptions,
  color: Color,
  referenceColor?: Color,
  temperature?: number,
): Color | null {
  const isInitial = temperature === undefined || referenceColor === undefined
  const colorGamut = options.colorGamut === 'p3' ? P3 : sRGB

  const checkCoords = (value: Coords): value is Color =>
    isColor(value) &&
    isWithin(value[0], options.lightness.range[0], options.lightness.range[1]) &&
    isWithin(value[1], options.chroma.range[0], options.chroma.range[1])

  let accumulator: Color | undefined

  // eslint-disable-next-line prefer-const
  accumulator = isInitial
    ? randomColorOneShot(options, color)
    : randomColorIterative(options, temperature, referenceColor, accumulator ?? [...color])

  // if (inGamut({ alpha: 1, coords: accumulator, space: options.colorSpace }, colorGamut)) {
  //   return accumulator
  // }

  const value = toGamutCSS(
    { alpha: 1, coords: [...accumulator], space: options.colorSpace },
    {
      space: colorGamut,
    },
  )

  const { coords } = to(value, options.colorSpace, { inGamut: false })

  if (checkCoords(coords)) {
    return coords
  }

  // const { coords: second } = toGamut(
  //   { alpha: 1, coords: [...accumulator], space: options.colorSpace },
  //   {
  //     deltaEMethod,
  //     method: 'clip',
  //     space: colorGamut,
  //   },
  // )
  //
  // if (checkCoords(second)) {
  //   return second
  // }

  return null
}
