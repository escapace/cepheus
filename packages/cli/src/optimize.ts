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
import { map, mapValues } from 'lodash-es'
import {
  errorFunction,
  mean,
  sample,
  standardDeviation,
  sum
} from 'simple-statistics'
import { OPTIMIZE_RANGE_MAX } from './constants'
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

const HUE_ANGLE = 30

function randomColor(
  options: RequiredOptimizeOptions,
  color: Color,
  referenceColor?: Color,
  temperature?: number
): Color {
  const selectedColor = clone(color)

  const [lightess, chroma, hue] = selectedColor.coords

  const next = (): Color => {
    if (temperature === undefined || referenceColor === undefined) {
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
          constrainAngle(
            randomWithin(
              selectedColor.coords[2] - HUE_ANGLE / 2,
              selectedColor.coords[2] + HUE_ANGLE / 2,
              options.prng
            )
          )
        ],
        alpha: 1
      }
    } else {
      const index = sample([0, 1, 2], 1, () => options.prng.float())[0]

      const percentage =
        0.05 +
        0.95 * errorFunction(temperature / options.hyperparameters.temperature)

      switch (index) {
        case 0:
          selectedColor.coords[index] = percentile(
            lightess,
            percentage,
            options.lightness.range[0],
            options.lightness.range[1],
            options.prng
          )

          break
        case 1:
          selectedColor.coords[index] = percentile(
            chroma,
            percentage,
            options.chroma.range[0],
            options.chroma.range[1],
            options.prng
          )

          break
        case 2:
          selectedColor.coords[index] = constrainAngle(
            percentile(
              hue,
              percentage,
              referenceColor.coords[2] - HUE_ANGLE / 2,
              referenceColor.coords[2] + HUE_ANGLE / 2,
              options.prng
            )
          )

          break
      }

      return selectedColor
    }
  }

  let iterations = 10000

  while (iterations !== 0) {
    const value = next()

    if (
      // isWithin(
      //   Math.abs(
      //     contrast(options.background, clone(value), { algorithm: 'APCA' })
      //   ),
      //   options.contrast.range[0],
      //   options.contrast.range[1]
      // ) &&
      inGamut(clone(value), options.colorSpace)
    ) {
      if (
        !isWithin(
          value.coords[0],
          options.lightness.range[0],
          options.lightness.range[1]
        )
      ) {
        throw new Error('Lightness out of range!')
      }

      if (
        !isWithin(
          value.coords[1],
          options.chroma.range[0],
          options.chroma.range[1]
        )
      ) {
        throw new Error('Chroma out of range!')
      }

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
  // reward the decrease in central tendency of distances from initial colors
  const differenceScore = mean(
    map(state, (c, index) => distance(c, options.colors[index]))
  )

  // reward the decrease in relative distance to lightness target
  const lightnessScore = relativeDifference(
    mean(map(state, (value) => value.coords[0])),
    options.lightness.target,
    options.lightness.range[0],
    options.lightness.range[1]
  )

  // reward the decrease in relative distance to chroma target
  const chromaScore = relativeDifference(
    mean(map(state, (value) => value.coords[1])),
    options.chroma.target,
    options.chroma.range[0],
    options.chroma.range[1]
  )

  // reward the increase of the centeral tendency of contrasts to background
  const contrastScore =
    1 -
    mean(
      map(options.background, (background) =>
        mean(
          map(
            state,
            (value) =>
              Math.abs(contrast(background, value, { algorithm: 'APCA' })) / 108
          )
        )
      )
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

  // const colorWeights =
  //   options.weights.normal +
  //   options.weights.protanopia +
  //   options.weights.deuteranopia +
  //   options.weights.deuteranopia

  // reward the increase of the standard deviation of distances between colors
  const dispersionScore =
    1 -
    standardDeviation(
      [
        ...normalDistances,
        ...protanopiaDistances,
        ...deuteranopiaDistances,
        ...tritanopiaDistances
      ].sort((a, b) => a - b)
    )

  // reward the increase of the centeral tendency of the distance from
  // surrounding colors
  const surroundingColorsScore =
    options.colorsSurrounding.length === 0
      ? 1
      : 1 -
        mean(
          map(state, (c, index) =>
            mean(
              map(options.colorsSurrounding, (colors) =>
                distance(c, colors[index])
              )
            )
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
    tritanopiaScore,
    surroundingColorsScore
  }).filter(([_, value]) => value > 1 || value < 0 || isNaN(value))

  if (issues.length !== 0) {
    throw new Error(
      `Out of bounds: ${map(issues, ([key, value]) => `${key}=${value}`).join(
        ', '
      )}.`
    )
  }

  // console.log({
  //   chromaScore,
  //   contrastScore,
  //   deuteranopiaScore,
  //   differenceScore,
  //   dispersionScore,
  //   lightnessScore,
  //   normalScore,
  //   protanopiaScore,
  //   tritanopiaScore,
  //   surroundingColorsScore
  // })

  return (
    options.weights.chroma * chromaScore +
    options.weights.contrast * contrastScore +
    options.weights.deuteranopia * deuteranopiaScore +
    options.weights.difference * differenceScore +
    options.weights.dispersion * dispersionScore +
    options.weights.lightness * lightnessScore +
    options.weights.normal * normalScore +
    options.weights.protanopia * protanopiaScore +
    options.weights.tritanopia * tritanopiaScore +
    options.weights.surround * surroundingColorsScore
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
  range: map(value.range, (v) => v / OPTIMIZE_RANGE_MAX) as [number, number],
  target: value.target / OPTIMIZE_RANGE_MAX
})

const normalizeChroma = (
  value: Required<Exclude<OptimizeOptions['chroma'], undefined>>
): Required<Exclude<OptimizeOptions['chroma'], undefined>> => ({
  range: map(value.range, (v) => (v / OPTIMIZE_RANGE_MAX) * 0.4) as [
    number,
    number
  ],
  target: (value.target / OPTIMIZE_RANGE_MAX) * 0.4
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

  const colorsPrevious = map(
    options.colorsPrevious ?? [],
    (coords): Color =>
      fixNaN({
        space: OKLCH,
        coords,
        alpha: 1
      })
  )

  const colorsSurrounding = map(options.colorsSurrounding, (value) =>
    map(
      value,
      (coords): Color =>
        fixNaN({
          space: OKLCH,
          coords,
          alpha: 1
        })
    )
  )

  const background = map(
    options.background,
    (coords): Color =>
      fixNaN({
        space: OKLCH,
        coords,
        alpha: 1
      })
  )

  // const isDarkMode =
  //   mean(
  //     map(colors, (value) => contrast(background, value, { algorithm: 'APCA' }))
  //   ) < 0

  const prng = createPRNG(options.randomSeed, options.randomSource)

  const colorSpace =
    options.colorSpace !== undefined ? ColorSpace.get(options.colorSpace) : P3

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const value = {
    colors,
    colorsPrevious,
    colorsSurrounding,
    background,
    prng,
    hyperparameters: {
      temperature: 6000,
      coolingRate: 0.99,
      cutoff: 0.0001,
      ...options.hyperparameters
    },

    weights: normalizeWeights({
      // pushes color to initial value
      difference: 45,
      // pushes color away from surrounding colors
      surround: 15,
      // pushes color to the lightness center
      lightness: 5,
      // pushes color to the chroma center
      chroma: 5,
      // pushes color away from background
      contrast: 8.75,
      // pushes color away from pallete colors
      dispersion: 5,
      normal: 5,
      protanopia: 3.75,
      tritanopia: 3.75,
      deuteranopia: 3.75,
      ...options.weights
    }),
    colorSpace,
    lightness: normalizeLightness({
      range: [0, OPTIMIZE_RANGE_MAX],
      target: mean(options.lightness?.range ?? [0, OPTIMIZE_RANGE_MAX]),
      ...options.lightness
    }),
    chroma: normalizeChroma({
      range: [0, OPTIMIZE_RANGE_MAX],
      target: mean(options.chroma?.range ?? [0, OPTIMIZE_RANGE_MAX]),
      ...options.chroma
    })
  } as RequiredOptimizeOptions

  ;(['lightness', 'chroma'] as const).forEach((key) => {
    if (
      !isWithin(value[key].target, value[key].range[0], value[key].range[1])
    ) {
      throw new Error(`${key} out of range`)
    }
  })

  return value
}

const iterate = (options: RequiredOptimizeOptions) => {
  const initialColors: Color[] =
    options.colorsPrevious.length === 0
      ? options.colors
      : options.colorsPrevious

  const colors: Color[] = map(initialColors, (color) =>
    randomColor(options, color)
  )

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
      newColors[index] = randomColor(
        options,
        newColors[index],
        options.colors[index],
        temperature
      )
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
    colors: map(bestColors, (value): [number, number, number] => value.coords)
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

    // console.error(options)

    throw e
  }
}
