import { type Deficiency, simulate as simulateDeficiency } from '@bjornlu/colorblind'
import {
  floatToByte,
  gamutMapOKLCH,
  sRGB as texelSRGB,
  sRGBGamut as texelSRGBGamut,
} from '@texel/color'
import { ColorSpace, normalizeAngle } from 'cepheus'
import {
  type PlainColorObject,
  ColorSpace as _ColorSpace,
  contrastAPCA,
  // to as convert,
  deltaEJz,
  inGamut,
  LCH,
  OKLCH,
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
import { createPRNG } from '../utilities/create-prng'
import { isWithin } from '../utilities/is-within'
import { percentile } from '../utilities/percentile'
import { randomWithin } from '../utilities/random-within'
import { relativeDifference } from '../utilities/relative-difference'
import { normalizeRange } from '../utilities/normalize-range'

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
  const space = options.colorSpace === ColorSpace.p3 ? sRGB : P3

  while (iterations !== 0) {
    let accumulator: Color | undefined

    // eslint-disable-next-line prefer-const
    accumulator = isInitial
      ? randomColorOneShot(options, color)
      : randomColorIterative(options, temperature, referenceColor, accumulator ?? [...color])

    if (inGamut({ alpha: 1, coords: accumulator, space: OKLCH }, space)) {
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

// JzCzhz is a preferred color model for distance calculation due to its strong perceptual uniformity
// and ability to maintain color accuracy over a wide luminance range, making it particularly effective
// for handling high-dynamic-range (HDR) and wide color gamut (WCG) applications. This model is
// designed to approximate human visual perception more closely, especially across different brightness
// levels, allowing for more consistent and meaningful distance measurements between colors as
// perceived by the human eye. The JzCzhz color space also simplifies gamut mapping operations, which
// supports efficient processing when calculating color differences, making it a reliable choice for
// applications requiring accurate color comparison and differentiation across diverse viewing
// conditions.
const distanceColorOjbect = (a: PlainColorObject, b: PlainColorObject) => deltaEJz(a, b)
const distance = (a: Color, b: Color) =>
  deltaEJz({ alpha: 1, coords: a, space: OKLCH }, { alpha: 1, coords: b, space: OKLCH })

const distances = (colors: Color[], deficiency?: Deficiency): number[] => {
  const distances: number[] = []

  const convertedColors = map(colors, (color): PlainColorObject => {
    if (deficiency === undefined) {
      return { alpha: 1, coords: color, space: OKLCH }
    }

    const sRGBColor = gamutMapOKLCH(color, texelSRGBGamut, texelSRGB)

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
      coords: map([r, g, b], (value) => value / 255) as [number, number, number],
      space: sRGB,
    }
  })

  for (let index = 0; index < colors.length; index++) {
    for (let index_ = index + 1; index_ < colors.length; index_++) {
      distances.push(distanceColorOjbect(convertedColors[index], convertedColors[index_]))
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
      map(options.colors[index], (initial) => distance(value, initial)),
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
                  { alpha: 1, coords: background, space: OKLCH },
                  { alpha: 1, coords: value, space: OKLCH },
                ),
              ) / 108,
          ),
        ),
      ),
    )

  // calculate distances under different vision conditions
  const normalDistances = distances(state)
  const protanopiaDistances = distances(state, 'protanopia')
  const deuteranopiaDistances = distances(state, 'deuteranopia')
  const tritanopiaDistances = distances(state, 'tritanopia')

  // penalize lower mean distances between colors (want colors to be more distinguishable)
  const normalCost = 1 - mean(normalDistances)
  const protanopiaCost = 1 - mean(protanopiaDistances)
  const deuteranopiaCost = 1 - mean(deuteranopiaDistances)
  const tritanopiaCost = 1 - mean(tritanopiaDistances)

  // penalize higher standard deviation of distances (want consistent differences)
  const dispersionNormalCost = standardDeviation([...normalDistances].sort((a, b) => a - b))
  const dispersionProtanopiaCost = standardDeviation([...protanopiaDistances].sort((a, b) => a - b))
  const dispersionDeuteranopiaCost = standardDeviation(
    [...deuteranopiaDistances].sort((a, b) => a - b),
  )
  const dispersionTritanopiaCost = standardDeviation([...tritanopiaDistances].sort((a, b) => a - b))

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
  range: normalizeRange(map(value.range, (value) => value / N) as [number, number], tolerance),
  target: value.target / N,
})

const normalizeChroma = (
  value: Required<Exclude<OptimizeOptions['chroma'], undefined>>,
  tolerance: number,
): Required<Exclude<OptimizeOptions['chroma'], undefined>> => ({
  range: normalizeRange(map(value.range, (v) => (v / N) * 0.4) as [number, number], tolerance),
  target: (value.target / N) * 0.4,
})

const normalizeOptions = (options: OptimizeOptions): RequiredOptimizeOptions => {
  const prng = createPRNG(options.randomSeed, options.randomSource)

  const hueAngle = normalizeAngle(options.hueAngle)
  const tolerance = options.tolerance ?? 1

  // eslint-disable-next-line typescript/consistent-type-assertions
  const value = {
    background: options.background,
    chroma: normalizeChroma(
      {
        range: [0, N],
        target: mean(options.chroma?.range ?? [0, N]),
        ...options.chroma,
      },
      tolerance,
    ),
    colors: options.colors,
    colorSpace: options.colorSpace,
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

  return {
    colors: map(bestColors, (value): [number, number, number] => value),
    cost: bestCost,
  }
}

export const optimize = async (
  options: OptimizeOptions,
  // eslint-disable-next-line typescript/require-await
): Promise<OptimizationState> => {
  _ColorSpace.register(LCH)
  _ColorSpace.register(OKLCH)
  _ColorSpace.register(sRGB)
  _ColorSpace.register(P3)

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
