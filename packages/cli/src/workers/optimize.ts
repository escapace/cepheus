import { type Deficiency, simulate as simulateDeficiency } from '@bjornlu/colorblind'
import { normalizeAngle } from 'cepheus'
import {
  type PlainColorObject,
  ColorSpace,
  contrastAPCA,
  to as convert,
  deltaEJz,
  deltaEOK2,
  inGamut,
  LCH,
  OKLCH,
  OKLrCH,
  P3,
  sRGB,
} from 'colorjs.io/fn'
import { flatMap, map } from 'lodash-es'
import { errorFunction, mean, sample, standardDeviation, sum } from 'simple-statistics'
import { N } from '../constants'
import {
  type OptimizationState,
  type OptimizeOptions,
  type RequiredOptimizeOptions,
  TypeOptimizationState,
} from '../types'
import { clamp } from '../utilities/clamp'
import { createPRNG } from '../utilities/create-prng'
import { fixNaN } from '../utilities/fix-nan'
import { isWithin } from '../utilities/is-within'
import { normalizeRange } from '../utilities/normalize-range'
import { percentile } from '../utilities/percentile'
import { randomWithin } from '../utilities/random-within'
import { relativeDifference } from '../utilities/relative-difference'

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
function normalizedCVD(x: number[]): number {
  if (x.length < 2) {
    throw new Error('Need at least 2 points to form a difference')
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

class IterationError extends Error {
  constructor(message: string) {
    super(message)

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, IterationError.prototype)
  }
}

type Color = [number, number, number]

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

  const percentage = 0.05 + 0.95 * errorFunction(temperature / options.hyperparameters.temperature)

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

function randomColor(
  options: RequiredOptimizeOptions,
  color: Color,
  referenceColor?: Color,
  temperature?: number,
): Color {
  let iterations = 10_000

  const isInitial = temperature === undefined || referenceColor === undefined
  const colorGamut = options.colorGamut === 'p3' ? P3 : sRGB

  while (iterations !== 0) {
    let accumulator: Color | undefined

    // eslint-disable-next-line prefer-const
    accumulator = isInitial
      ? randomColorOneShot(options, color)
      : randomColorIterative(options, temperature, referenceColor, accumulator ?? [...color])

    if (inGamut({ alpha: 1, coords: accumulator, space: options.colorSpace }, colorGamut)) {
      if (!isWithin(accumulator[0], options.lightness.range[0], options.lightness.range[1])) {
        throw new Error(
          `Lightness out of range! ${JSON.stringify([
            accumulator[0],
            options.lightness.range[0],
            options.lightness.range[1],
          ])}`,
        )
      }

      if (!isWithin(accumulator[1], options.chroma.range[0], options.chroma.range[1])) {
        throw new Error('Chroma out of range!')
      }

      return accumulator
    }

    iterations--
  }

  throw new IterationError('Iteration limit exceeded.')
}

const floatToByte = (value: number) => clamp(Math.round(255 * value), 0, 255)

const distances = (
  colors: Color[],
  options: RequiredOptimizeOptions,
  deficiency?: Deficiency,
): number[] => {
  const distances: number[] = []

  const convertedColors = map(colors, (color): PlainColorObject => {
    if (deficiency === undefined) {
      return { alpha: 1, coords: color, space: options.colorSpace }
    }

    const sRGBColor = fixNaN(
      convert({ alpha: 1, coords: color, space: options.colorSpace }, sRGB, {
        inGamut: { method: 'css', space: sRGB },
      }).coords,
    )

    const { b, g, r } = simulateDeficiency(
      {
        b: floatToByte(sRGBColor[2]),
        g: floatToByte(sRGBColor[1]),
        r: floatToByte(sRGBColor[0]),
      },
      deficiency,
    )

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      throw new TypeError(`${deficiency} outputs NaN`)
    }

    return {
      alpha: 1,
      coords: map([r, g, b], (value) => value / 255),
      space: sRGB,
    }
  })

  for (let index = 0; index < colors.length; index++) {
    for (let index_ = index + 1; index_ < colors.length; index_++) {
      distances.push(options.distanceColorOjbect(convertedColors[index], convertedColors[index_]))
    }
  }

  return distances
}

// Cost function including weights
const createCosts = (
  options: RequiredOptimizeOptions,
  state: Color[],
): OptimizeOptions['weights'] => {
  // penalize the increase in the mean distance from initial colors
  const differenceCost = mean(
    flatMap(state, (value, index) =>
      map(options.colors[index], (initial) => options.distance(value, initial)),
    ),
  )

  // penalize the deviation from the target lightness
  const lightnessCost = relativeDifference(
    mean(map(state, (value) => value[0])),
    options.lightness.target,
    options.lightness.range[0],
    options.lightness.range[1],
  )

  if (isNaN(lightnessCost)) {
    const data = [
      mean(map(state, (value) => value[0])),
      options.lightness.target,
      options.lightness.range[0],
      options.lightness.range[1],
    ]

    throw new Error(`NAN ${JSON.stringify(data)}`)
  }

  // penalize the deviation from the mean hue
  const hueCost = mean(
    flatMap(state, (a, index) =>
      map(options.colors[index], (b) => normalizeAngle(a[2] - b[2]) / 360),
    ),
  )

  // penalize the deviation from the target chroma
  const chromaCost = relativeDifference(
    mean(map(state, (value) => value[1])),
    options.chroma.target,
    options.chroma.range[0],
    options.chroma.range[1],
  )

  // penalize lower contrasts with the background
  const contrastCost =
    1 -
    mean(
      map(options.background, (background) =>
        mean(
          map(
            state,
            (value) =>
              Math.abs(
                contrastAPCA(
                  { alpha: 1, coords: background, space: options.colorSpace },
                  { alpha: 1, coords: value, space: options.colorSpace },
                ),
              ) / 108,
          ),
        ),
      ),
    )

  // calculate distances under different vision conditions
  const normalDistances = distances(state, options)
  const protanopiaDistances = distances(state, options, 'protanopia')
  const deuteranopiaDistances = distances(state, options, 'deuteranopia')
  const tritanopiaDistances = distances(state, options, 'tritanopia')

  // penalize lower mean distances between colors (want colors to be more distinguishable)
  const normalCost = 1 - mean(normalDistances)
  const protanopiaCost = 1 - mean(protanopiaDistances)
  const deuteranopiaCost = 1 - mean(deuteranopiaDistances)
  const tritanopiaCost = 1 - mean(tritanopiaDistances)

  // penalize higher highly uneven distances between colors (want consistent differences)
  const dispersionNormalCost = normalizedCVD([...normalDistances].sort((a, b) => a - b))
  const dispersionProtanopiaCost = normalizedCVD([...protanopiaDistances].sort((a, b) => a - b))
  const dispersionDeuteranopiaCost = normalizedCVD([...deuteranopiaDistances].sort((a, b) => a - b))
  const dispersionTritanopiaCost = normalizedCVD([...tritanopiaDistances].sort((a, b) => a - b))

  const issues = Object.entries({
    chromaCost,
    contrastCost,
    deuteranopiaCost,
    differenceCost,
    dispersionDeuteranopiaCost,
    dispersionNormalCost,
    dispersionProtanopiaCost,
    dispersionTritanopiaCost,
    hueCost,
    lightnessCost,
    normalCost,
    protanopiaCost,
    tritanopiaCost,
  }).filter(([_, value]) => {
    const v = Math.fround(value)
    return v > 1 || v < 0 || isNaN(v)
  })

  if (issues.length !== 0) {
    console.log({
      dispersionDeuteranopiaCost,
      dispersionNormalCost,
      dispersionProtanopiaCost,
      dispersionTritanopiaCost,

      deuteranopiaDistances,
      normalDistances,
      protanopiaDistances,
      tritanopiaDistances,
    })

    throw new Error(
      `Out of bounds: ${map(issues, ([key, value]) => `${key}=${value}`).join(', ')}.`,
    )
  }

  return {
    chroma: chromaCost,
    contrast: contrastCost,
    deuteranopia: deuteranopiaCost,
    difference: differenceCost,
    dispersionDeuteranopia: dispersionDeuteranopiaCost,
    dispersionNormal: dispersionNormalCost,
    dispersionProtanopia: dispersionProtanopiaCost,
    dispersionTritanopia: dispersionTritanopiaCost,
    hue: hueCost,
    lightness: lightnessCost,
    normal: normalCost,
    protanopia: protanopiaCost,
    tritanopia: tritanopiaCost,
  }
}

const cost = (options: RequiredOptimizeOptions, state: Color[]) => {
  const costs = createCosts(options, state)

  Object.entries(costs).forEach(([_key, value]) => {
    const key = _key as keyof RequiredOptimizeOptions['costs']
    const [min, max] = options.costs[key] ?? [value, value]

    options.costs[key] = [Math.min(min, value), Math.max(max, value)]
  })

  return sum(
    (Object.keys(options.weights) as Array<keyof typeof costs>).map(
      (key) => options.weights[key] * costs[key],
    ),
  )
}

const normalizeLightness = (
  value: Required<Exclude<OptimizeOptions['lightness'], undefined>>,
  tolerance: number,
): Required<Exclude<OptimizeOptions['lightness'], undefined>> => ({
  range: normalizeRange(
    map(value.range, (value) => value / N),
    tolerance,
  ),
  target: value.target / N,
})

const normalizeChroma = (
  value: Required<Exclude<OptimizeOptions['chroma'], undefined>>,
  tolerance: number,
): Required<Exclude<OptimizeOptions['chroma'], undefined>> => ({
  range: normalizeRange(
    map(value.range, (v) => (v / N) * 0.4),
    tolerance,
  ),
  target: (value.target / N) * 0.4,
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

  const distanceEJzColorOjbect = (a: PlainColorObject, b: PlainColorObject) =>
    deltaEJz(a, b) / (options.colorGamut === 'srgb' ? 0.34 : 0.37)
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

const normalizeOptions = (options: OptimizeOptions): RequiredOptimizeOptions => {
  const prng = createPRNG(options.randomSeed, options.randomSource)

  const hueAngle = normalizeAngle(options.hueAngle)
  const tolerance = options.tolerance ?? 1

  // eslint-disable-next-line typescript/consistent-type-assertions
  const value = {
    ...createDistanceFunction(options),
    background: options.background,
    chroma: normalizeChroma(
      {
        range: [0, N],
        target: mean(options.chroma?.range ?? [0, N]),
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
      coolingRate: 0.99,
      cutoff: 0.0001,
      temperature: 8000,
      ...options.hyperparameters,
    },
    lightness: normalizeLightness(
      {
        range: [0, N],
        target: mean(options.lightness?.range ?? [0, N]),
        ...options.lightness,
      },
      tolerance,
    ),
    prng,
    tolerance: options.tolerance,
    weights: options.weights,
  } as RequiredOptimizeOptions

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

  return value
}

const iterate = (options: RequiredOptimizeOptions) => {
  const colors: Color[] = map(options.colors, (colors) =>
    randomColor(options, sample(colors, 1, () => options.prng.float())[0]),
  )

  const startColors: Color[] = colors.map((value) => [...value])
  const startCost = cost(options, startColors)

  // intialize hyperparameters
  let temperature = options.hyperparameters.temperature

  let bestCost: number = startCost
  let bestColors: Color[] = startColors
  let changed = false

  // iteration loop
  while (temperature > options.hyperparameters.cutoff) {
    // for each color
    for (let index = 0; index < colors.length; index++) {
      try {
        // copy old colors
        const newColors = [...colors]
        // move the current color randomly
        newColors[index] = randomColor(
          options,
          newColors[index],
          sample(options.colors[index], 1, () => options.prng.float())[0],
          temperature,
        )

        const delta = cost(options, newColors) - cost(options, colors)

        if (delta <= 0) {
          // Accept the new state unconditionally because it's better
          colors[index] = newColors[index]
        } else {
          // calculate acceptance probability for worse states
          const probability = Math.exp(-delta / temperature)
          if (options.prng.float() < probability) {
            colors[index] = newColors[index]
          }
        }
      } catch (error) {}
    }

    const current = cost(options, colors)

    if (current < bestCost) {
      bestCost = current
      bestColors = colors
      changed = true
    }

    // decrease temperature
    temperature *= options.hyperparameters.coolingRate
  }

  if (!changed) {
    throw new IterationError('No Changes')
  }

  console.log(options.costs)

  return {
    colors: map(bestColors, (value): [number, number, number] => value),
    cost: bestCost,
  }
}

export const optimize = async (
  options: OptimizeOptions,
  // eslint-disable-next-line typescript/require-await
): Promise<OptimizationState> => {
  ColorSpace.register(LCH)
  ColorSpace.register(OKLCH)
  ColorSpace.register(OKLrCH)
  ColorSpace.register(sRGB)
  ColorSpace.register(P3)

  try {
    const normalizedOptions = normalizeOptions(options)

    return {
      type: TypeOptimizationState.Fulfilled,
      ...iterate(normalizedOptions),
    }
  } catch (error) {
    if (error instanceof IterationError) {
      return { type: TypeOptimizationState.Rejected }
    }

    console.error(error)

    throw error
  }
}
