import { Deficiency, simulate as simulateDeficiency } from '@bjornlu/colorblind'
import {
  clone,
  Color,
  ColorSpace,
  contrast,
  convert,
  deltaEOK,
  fixNaN,
  inGamut,
  LCH,
  OKLCH,
  P3,
  sRGB
} from '@cepheus/color'
import { flatMap, map, mapValues, range } from 'lodash-es'
import { errorFunction, mean, sample, sum, variance } from 'simple-statistics'
import {
  OptimizationState,
  OptimizeOptions,
  RequiredOptimizeOptions,
  TypeOptimizationState
} from './types'
import { constrainAngle } from './utilities/constrain-angle'
import { createPRNG } from './utilities/create-prng'
import { isWithin } from './utilities/is-within'
import { percentile } from './utilities/percentile'
import { randomWithin } from './utilities/random-within'
import { relativeDifference } from './utilities/relative-difference'

class IterationError extends Error {
  constructor(message: string) {
    super(message)

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, IterationError.prototype)
  }
}

function randomColor(options: RequiredOptimizeOptions): Color
function randomColor(
  options: RequiredOptimizeOptions,
  colors: Color[],
  colorIndex: number,
  temperature: number
): Color
function randomColor(
  options: RequiredOptimizeOptions,
  colors?: Color[],
  colorIndex?: number,
  temperature?: number
): Color {
  const next = (): Color => {
    if (colors === undefined || colorIndex === undefined) {
      return {
        space: OKLCH,
        coords: [
          randomWithin(
            options.lightness.range[0],
            options.lightness.range[1],
            options.prng
          ),
          randomWithin(
            options.chroma.range[0],
            options.chroma.range[1],
            options.prng
          ),
          randomWithin(0, 360, options.prng)
        ],
        alpha: 1
      }
    } else {
      const index = sample([0, 1, 2], 1, () => options.prng.float())[0]

      const value = clone(colors[colorIndex])

      // TODO: better distribution
      const percentage =
        0.05 +
        0.5 *
          errorFunction(
            (temperature as number) / options.hyperparameters.temperature
          )

      switch (index) {
        case 0:
          value.coords[index] = percentile(
            value.coords[index],
            percentage,
            options.lightness.range[0],
            options.lightness.range[1],
            options.prng
          )

          break
        case 1:
          value.coords[index] = percentile(
            value.coords[index],
            percentage,
            options.chroma.range[0],
            options.chroma.range[1],
            options.prng
          )

          break
        case 2:
          value.coords[index] = constrainAngle(
            percentile(
              value.coords[index],
              percentage,
              options.colors[colorIndex].coords[2] - 30,
              options.colors[colorIndex].coords[2] + 30,
              options.prng
            )
          )

          break
      }

      return value
    }
  }

  let iterations = 100000

  while (iterations !== 0) {
    const value = next()

    if (
      isWithin(
        Math.abs(contrast(options.background, value, { algorithm: 'APCA' })),
        options.contrast.range[0],
        options.contrast.range[1]
      ) &&
      inGamut(value, options.colorSpace)
    ) {
      return value
    }

    iterations--
  }

  throw new IterationError('Iteration limit exceeded.')
}

const distance = (a: Color, b: Color) => deltaEOK(a, b)

// const getClosestColor = (color, colorArray) => {
//   const distances = colorArray.map((c) => distance(color, c))
//   const minIndex = distances.indexOf(Math.min(...distances))
//   return colorArray[minIndex]
// }

const distances = (colors: Color[], deficiency?: Deficiency) => {
  const distances: number[] = []

  const convertedColors = map(colors, (color) => {
    if (deficiency === undefined) {
      return color
    }

    const sRGBColor = convert(color, sRGB, { inGamut: true })

    const { r, g, b } = simulateDeficiency(
      {
        r: Math.round(sRGBColor.coords[0] * 255),
        g: Math.round(sRGBColor.coords[1] * 255),
        b: Math.round(sRGBColor.coords[2] * 255)
      },
      deficiency
    )

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      throw new Error(`${deficiency} outputs NaN`)
    }

    return fixNaN(
      convert(
        {
          space: sRGB,
          coords: map([r, g, b], (value) => value / 255.0) as [
            number,
            number,
            number
          ],
          alpha: 1
        },
        sRGB,
        { inGamut: true }
      )
    )
  })

  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      distances.push(distance(convertedColors[i], convertedColors[j]))
    }
  }

  return distances
}

// Cost function including weights
const cost = (options: RequiredOptimizeOptions, state: Color[]) => {
  // average of the distance from target colors
  const differenceScore = mean(
    map(state, (c, index) => distance(c, options.colors[index]))
  )

  const lightnessScore = relativeDifference(
    mean(map(state, (value) => value.coords[0])),
    options.lightness.target,
    options.lightness.range[0],
    options.lightness.range[1]
  )

  const chromaScore = relativeDifference(
    mean(map(state, (value) => value.coords[1])),
    options.chroma.target,
    options.chroma.range[0],
    options.chroma.range[1]
  )

  const contrastScore = relativeDifference(
    mean(
      map(state, (value) =>
        Math.abs(contrast(options.background, value, { algorithm: 'APCA' }))
      )
    ),
    options.contrast.target,
    options.contrast.range[0],
    options.contrast.range[1]
  )

  const normalDistances = distances(state)
  const protanopiaDistances = distances(state, 'protanopia')
  const deuteranopiaDistances = distances(state, 'deuteranopia')
  const tritanopiaDistances = distances(state, 'tritanopia')

  // reward the increase in central tendency of distances between colors
  const normalScore = 1 - mean(normalDistances)
  const protanopiaScore = 1 - mean(protanopiaDistances)
  const deuteranopiaScore = 1 - mean(deuteranopiaDistances)
  const tritanopiaScore = 1 - mean(tritanopiaDistances)

  const colorWeights =
    options.weights.normal +
    options.weights.protanopia +
    options.weights.deuteranopia +
    options.weights.deuteranopia

  const dispersionScore =
    1 -
    mean(
      flatMap(
        [
          [normalDistances, options.weights.normal / colorWeights] as const,
          [
            protanopiaDistances,
            options.weights.protanopia / colorWeights
          ] as const,
          [
            deuteranopiaDistances,
            options.weights.deuteranopia / colorWeights
          ] as const,
          [
            tritanopiaDistances,
            options.weights.tritanopia / colorWeights
          ] as const
        ],
        ([value, weight]) => variance(value) * weight
      )
    )

  const issues = Object.entries({
    chromaScore,
    contrastScore,
    deuteranopiaScore,
    differenceScore,
    dispersionScore,
    lightnessScore,
    normalScore,
    protanopiaScore,
    tritanopiaScore
  }).filter(([_, value]) => value > 1 || value < 0 || isNaN(value))

  if (issues.length !== 0) {
    throw new Error(
      `Out of bounds: ${issues
        .map(([key, value]) => `${key}=${value}`)
        .join(', ')}.`
    )
  }

  return (
    options.weights.chroma * chromaScore +
    options.weights.contrast * contrastScore +
    options.weights.deuteranopia * deuteranopiaScore +
    options.weights.difference * differenceScore +
    options.weights.dispersion * dispersionScore +
    options.weights.lightness * lightnessScore +
    options.weights.normal * normalScore +
    options.weights.protanopia * protanopiaScore +
    options.weights.tritanopia * tritanopiaScore
  )
}

const normalizeWeights = (
  weights: Required<Exclude<OptimizeOptions['weights'], undefined>>
): Required<Exclude<OptimizeOptions['weights'], undefined>> => {
  const total = sum(Object.values(weights))

  return mapValues(weights, (value) => value / total)
}

const normalizeLightness = (
  value: Required<Exclude<OptimizeOptions['lightness'], undefined>>
): Required<Exclude<OptimizeOptions['lightness'], undefined>> => ({
  range: map(value.range, (v) => v / 100) as [number, number],
  target: value.target / 100
})

const normalizeChroma = (
  value: Required<Exclude<OptimizeOptions['chroma'], undefined>>
): Required<Exclude<OptimizeOptions['chroma'], undefined>> => ({
  range: map(value.range, (v) => (v / 100) * 0.4) as [number, number],
  target: (value.target / 100) * 0.4
})

const normalizeContrast = (
  value: Required<Exclude<OptimizeOptions['contrast'], undefined>>,
  isDarkMode: boolean
): Required<Exclude<OptimizeOptions['contrast'], undefined>> => ({
  range: map(value.range, (v) => (v / 100) * (isDarkMode ? 108 : 106)) as [
    number,
    number
  ],
  target: (value.target / 100) * (isDarkMode ? 108 : 106)
})

const normalizeOptions = (
  options: OptimizeOptions
): RequiredOptimizeOptions => {
  const colors = map(
    options.colors,
    (coords): Color =>
      fixNaN({
        space: OKLCH,
        coords,
        alpha: 1
      })
  )

  const background: Color = fixNaN({
    space: OKLCH,
    coords: options.background,
    alpha: 1
  })

  const isDarkMode =
    mean(
      map(colors, (value) => contrast(background, value, { algorithm: 'APCA' }))
    ) < 0

  const prng = createPRNG(options.randomSeed, options.randomSource)

  const colorSpace =
    options.colorSpace !== undefined ? ColorSpace.get(options.colorSpace) : P3

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const value = {
    colors,
    background,
    prng,
    isDarkMode,
    hyperparameters: {
      temperature: 2000,
      coolingRate: 0.99,
      cutoff: 0.0001,
      ...options.hyperparameters
    },
    weights: normalizeWeights({
      difference: 200,
      dispersion: 80,
      // coords
      lightness: 10,
      chroma: 10,
      contrast: 10,
      // color-vision
      normal: 20,
      protanopia: 10,
      tritanopia: 10,
      deuteranopia: 10,
      ...options.weights
    }),
    colorSpace,
    lightness: normalizeLightness({
      range: [0, 100],
      target: mean(options.lightness?.range ?? [0, 1]),
      ...options.lightness
    }),
    chroma: normalizeChroma({
      range: [0, 100],
      target: mean(options.chroma?.range ?? [0, 100]),
      ...options.chroma
    }),
    contrast: normalizeContrast(
      {
        range: [0, 100],
        target: mean(options.contrast?.range ?? [0, 100]),
        ...options.contrast
      },
      isDarkMode
    )
  } as RequiredOptimizeOptions

  ;(['lightness', 'chroma', 'contrast'] as const).forEach((key) => {
    if (
      !isWithin(value[key].target, value[key].range[0], value[key].range[1])
    ) {
      throw new Error(`${key} out of range`)
    }
  })

  return value
}

const iterate = (options: RequiredOptimizeOptions) => {
  const n = options.colors.length
  const colors: Color[] = map(range(n), () => randomColor(options))

  const startColors = Array.from(colors)
  const startCost = cost(options, startColors)

  // intialize hyperparameters
  let temperature = options.hyperparameters.temperature

  let bestCost: number = startCost
  let bestColors: Color[] = startColors

  // iteration loop
  while (temperature > options.hyperparameters.cutoff) {
    // for each color
    for (let index = 0; index < colors.length; index++) {
      // copy old colors
      const newColors = [...colors]
      // move the current color randomly
      newColors[index] = randomColor(options, newColors, index, temperature)
      // choose between the current state and the new state
      // based on the difference between the two, the temperature
      // of the algorithm, and some random chance
      const delta = cost(options, newColors) - cost(options, colors)
      const probability = Math.exp(-delta / temperature)
      if (options.prng.float() < probability) {
        colors[index] = newColors[index]
      }
    }

    const current = cost(options, colors)

    if (current < bestCost) {
      bestCost = current
      bestColors = colors
    }

    // decrease temperature
    temperature *= options.hyperparameters.coolingRate
  }

  return {
    cost: bestCost,
    colors: bestColors.map((value): [number, number, number] => value.coords)
  }
}

export const optimize = (options: OptimizeOptions): OptimizationState => {
  ColorSpace.register(LCH)
  ColorSpace.register(OKLCH)
  ColorSpace.register(sRGB)
  ColorSpace.register(P3)

  const normalizedOptions = normalizeOptions(options)

  try {
    return {
      type: TypeOptimizationState.Fulfilled,
      ...iterate(normalizedOptions)
    }
  } catch (e) {
    if (e instanceof IterationError) {
      return { type: TypeOptimizationState.Rejected }
    }

    throw e
  }
}
