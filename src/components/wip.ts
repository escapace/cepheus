import { Deficiency, simulate as simulateDeficiency } from '@bjornlu/colorblind'
import { defaultsDeep, flatMap, map, mapValues, range } from 'lodash-es'
import { errorFunction, mean, sample, sum, variance } from 'simple-statistics'
import type { DeepRequired } from 'utility-types'
import {
  clone,
  Color,
  ColorSpace,
  contrast,
  convert,
  deltaEOK,
  inGamut
} from '../colorjs-io'
import { clamp } from '../utilities/clamp'
import { isWithin } from '../utilities/is-within'
import { randomWithin } from '../utilities/random-within'
import { relativeDifference } from '../utilities/relative-difference'

// TODO: assert
// 11.53

export class IterationError extends Error {
  constructor(message: string) {
    super(message)

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, IterationError.prototype)
  }
}

function randomColor(options: RequiredOptions): Color
function randomColor(
  options: RequiredOptions,
  color: Color,
  temperature: number
): Color
function randomColor(
  options: RequiredOptions,
  color?: Color,
  temperature?: number
): Color {
  const next = (): Color => {
    if (color === undefined) {
      return {
        space: ColorSpace.get('oklch'),
        coords: [
          randomWithin(
            options.lightness.range[0],
            options.lightness.range[1],
            options.random
          ),
          randomWithin(
            options.chroma.range[0],
            options.chroma.range[1],
            options.random
          ),
          randomWithin(0, 360, options.random)
        ],
        alpha: 1
      }
    } else {
      const index = sample([0, 1, 2], 1, options.random)[0]

      const value = clone(color)

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
            options.random
          )

          break
        case 1:
          value.coords[index] = percentile(
            value.coords[index],
            percentage,
            options.chroma.range[0],
            options.chroma.range[1],
            options.random
          )

          break
        case 2:
          value.coords[index] = percentile(
            value.coords[index],
            percentage,
            0,
            360,
            options.random
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

    const sRGBColor = convert(color, 'srgb', { inGamut: true })

    const { r, g, b } = simulateDeficiency(
      {
        r: Math.round(sRGBColor.coords[0] * 255),
        g: Math.round(sRGBColor.coords[1] * 255),
        b: Math.round(sRGBColor.coords[2] * 255)
      },
      deficiency
    )

    console.assert(
      !(isNaN(r) || isNaN(g) || isNaN(b)),
      `${deficiency} outputs NaN`,
      { r, g, b }
    )

    return convert(
      {
        space: ColorSpace.get('srgb'),
        coords: map([r, g, b], (value) => value / 255.0),
        alpha: 1
      },
      'oklch',
      { inGamut: true }
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
const cost = (options: RequiredOptions, state: Color[]) => {
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

  if (
    [
      contrastScore,
      deuteranopiaScore,
      differenceScore,
      dispersionScore,
      normalScore,
      protanopiaScore,
      tritanopiaScore
    ].some((value) => value > 1 || value < 0 || isNaN(value))
  ) {
    throw new Error('Out of bounds.')
  }

  return (
    options.weights.chroma * chromaScore +
    options.weights.lightness * lightnessScore +
    options.weights.contrast * contrastScore +
    options.weights.deuteranopia * deuteranopiaScore +
    options.weights.difference * differenceScore +
    options.weights.dispersion * dispersionScore +
    options.weights.normal * normalScore +
    options.weights.protanopia * protanopiaScore +
    options.weights.tritanopia * tritanopiaScore
  )
}

const percentile = (
  current: number,
  percent: number,
  min: number,
  max: number,
  randomSource: () => number
) => {
  const value = percent * (max - min)

  return clamp(
    current + randomWithin(-1.0 * value, value, randomSource),
    min,
    max
  )
}

interface Options {
  random: () => number
  colors: Color[]
  background: Color
  colorSpace?: ColorSpace
  hyperparameters?: {
    temperature: number
    coolingRate: number
    cutoff: number
  }
  weights?: {
    chroma: number
    contrast: number
    deuteranopia: number
    difference: number
    dispersion: number
    lightness: number
    normal: number
    protanopia: number
    tritanopia: number
  }
  lightness?: {
    // Lightness [0, 1]
    target?: number
    range?: [number, number]
  }
  chroma?: {
    // Chroma [0, 0.4]
    target?: number
    range?: [number, number]
  }
  contrast?: {
    // APCA [0, 106] or [0, 108]
    target?: number
    /* APCA reports lightness contrast as an Lc value from Lc 0 to Lc 106 for dark
     * text on a light background, and Lc 0 to Lc -108 for light text on a dark
     * background (dark mode). The minus sign merely indicates negative contrast,
     * which means light text on a dark background. */
    range?: [number, number]
  }
}

type RequiredOptions = DeepRequired<Options>

const normalizeWeights = (
  weights: Required<Exclude<Options['weights'], undefined>>
): Required<Exclude<Options['weights'], undefined>> => {
  const total = sum(Object.values(weights))

  return mapValues(weights, (value) => value / total)
}

const normalizeOptions = (options: Options): RequiredOptions => {
  const value = defaultsDeep(
    {
      ...options,
      colors: options.colors.map((value) =>
        convert(value, 'oklch', { inGamut: true })
      ),
      background: convert(options.background, 'oklch', { inGamut: true })
    },
    {
      hyperparameters: {
        temperature: 2000,
        coolingRate: 0.99,
        cutoff: 0.0001
      },
      weights: normalizeWeights({
        difference: 200,
        dispersion: 80,
        // color-vision
        normal: 20,
        protanopia: 10,
        tritanopia: 10,
        deuteranopia: 10,
        // coords
        lightness: 5,
        chroma: 5,
        contrast: 5,
        ...options.weights
      }),
      colorSpace: ColorSpace.get('p3'),
      lightness: {
        range: [0, 1],
        target: mean(options.lightness?.range ?? [0, 1]),
        ...options.lightness
      },
      chroma: {
        range: [0, 0.4],
        target: mean(options.chroma?.range ?? [0, 0.4]),
        ...options.chroma
      },
      contrast: {
        range: [30, 108],
        target: mean(options.contrast?.range ?? [30, 108]),
        ...options.contrast
      }
    }
  ) as RequiredOptions

  ;(['lightness', 'chroma', 'contrast'] as const).forEach((key) => {
    if (
      !isWithin(value[key].target, value[key].range[0], value[key].range[1])
    ) {
      throw new Error(`${key} out of range`)
    }
  })

  return value
}

export const optimize = (options: Options): Color[] => {
  const normalizedOptions = normalizeOptions(options)

  const n = normalizedOptions.colors.length
  const colors: Color[] = range(n).map(() => randomColor(normalizedOptions))

  const startColors = Array.from(colors)
  const startCost = cost(normalizedOptions, startColors)

  // intialize hyperparameters
  let temperature = normalizedOptions.hyperparameters.temperature

  let bestCost: number = startCost
  let bestColors: Color[] = startColors

  // iteration loop
  while (temperature > normalizedOptions.hyperparameters.cutoff) {
    // for each color
    for (let i = 0; i < colors.length; i++) {
      // copy old colors
      const newColors = [...colors]
      // move the current color randomly
      newColors[i] = randomColor(normalizedOptions, newColors[i], temperature)
      // choose between the current state and the new state
      // based on the difference between the two, the temperature
      // of the algorithm, and some random chance
      const delta =
        cost(normalizedOptions, newColors) - cost(normalizedOptions, colors)
      const probability = Math.exp(-delta / temperature)
      if (normalizedOptions.random() < probability) {
        colors[i] = newColors[i]
      }
    }

    const current = cost(normalizedOptions, colors)

    console.log(`Current cost: ${current}`)

    if (current < bestCost) {
      bestCost = current
      bestColors = colors
    }

    // decrease temperature
    temperature *= normalizedOptions.hyperparameters.coolingRate
  }

  console.log(`${((1 - bestCost / startCost) * 100).toFixed(2)}% Optimized`)

  return bestColors
}

// const run = () => {
//   // function getRandomArbitrary(min, max) {
//   //   return Math.random() * (max - min) + min;
//   // }
//
//   const nanoid = customRandom('abcdefghijklmnopqrstuvwxyz', 10, (size) => {
//     return new Uint8Array(size).map(() => 256 * prng.next())
//   })
//
//   // 100 random colors
//
//   const colors = map(_range(24), () => {
//     return {
//       id: nanoid(),
//       color: new Color({
//         space: 'p3',
//         coords: [prng.next(), prng.next(), prng.next()]
//       })
//     }
//   })
//
//   // const clusters = Clusterer.getInstance(colors, 8, (a, b) => {
//   //   return Math.abs(a.color.deltaEJz(b.color))
//   // })
//   //   .getClusteredData()
//   //   .map((value) => {
//   //     return [...value].sort(
//   //       (a, b) => b.color.clone().to('oklab').l - a.color.clone().to('oklab').l
//   //     )
//   //   })
// }
