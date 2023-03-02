import { Deficiency, simulate as simulateDeficiency } from '@bjornlu/colorblind'
import {
  clone,
  Color,
  ColorSpace,
  contrastAPCA,
  convert,
  deltaEJz,
  fixNaN,
  inGamut,
  LCH,
  OKLCH,
  P3,
  sRGB
} from '@cepheus/color'
import { ColorSpace as ColorSpaceId, normalizeAngle } from 'cepheus'
import { flatMap, map } from 'lodash-es'
import {
  errorFunction,
  mean,
  sample,
  standardDeviation
} from 'simple-statistics'
import { N } from '../constants'
import {
  OptimizationState,
  OptimizeOptions,
  RequiredOptimizeOptions,
  TypeOptimizationState
} from '../types'
import { createPRNG } from '../utilities/create-prng'
import { isWithin } from '../utilities/is-within'
import { percentile } from '../utilities/percentile'
import { randomWithin } from '../utilities/random-within'
import { relativeDifference } from '../utilities/relative-difference'

class IterationError extends Error {
  constructor(message: string) {
    super(message)

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, IterationError.prototype)
  }
}

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
          normalizeAngle(
            randomWithin(
              selectedColor.coords[2] - options.hueAngle / 2,
              selectedColor.coords[2] + options.hueAngle / 2,
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
          selectedColor.coords[index] = normalizeAngle(
            percentile(
              hue,
              percentage,
              referenceColor.coords[2] - options.hueAngle / 2,
              referenceColor.coords[2] + options.hueAngle / 2,
              options.prng
            )
          )

          break
      }

      return selectedColor
    }
  }

  let iterations = 15000

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
        throw new Error(
          `Lightness out of range! ${JSON.stringify([
            value.coords[0],
            options.lightness.range[0],
            options.lightness.range[1]
          ])}`
        )
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

const distance = (a: Color, b: Color) => deltaEJz(a, b)

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
    flatMap(state, (c, index) => {
      return map(options.colors[index], (color) => {
        const modifiedColor = clone(color)

        modifiedColor.coords[0] = c.coords[0]

        return distance(c, modifiedColor)
      })
    })
  )

  // reward the decrease in relative distance to lightness target
  const lightnessScore = relativeDifference(
    mean(map(state, (value) => value.coords[0])),
    options.lightness.target,
    options.lightness.range[0],
    options.lightness.range[1]
  )

  if (isNaN(lightnessScore)) {
    const data = [
      mean(map(state, (value) => value.coords[0])),
      options.lightness.target,
      options.lightness.range[0],
      options.lightness.range[1]
    ]

    throw new Error(`NAN ${JSON.stringify(data)}`)
  }

  // reward the decrease in relative distance to mean hue
  const hueScore = mean(
    flatMap(state, ({ coords: a }, index) =>
      map(
        options.colors[index],
        ({ coords: b }) => normalizeAngle(a[2] - b[2]) / 360
      )
    )
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
          map(state, (value) => Math.abs(contrastAPCA(background, value)) / 108)
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

  const issues = Object.entries({
    chromaScore,
    contrastScore,
    deuteranopiaScore,
    differenceScore,
    dispersionScore,
    hueScore,
    lightnessScore,
    normalScore,
    protanopiaScore,
    tritanopiaScore
  }).filter(([_, value]) => {
    const v = Math.fround(value)
    return v > 1 || v < 0 || isNaN(v)
  })

  if (issues.length !== 0) {
    throw new Error(
      `Out of bounds: ${map(issues, ([key, value]) => `${key}=${value}`).join(
        ', '
      )}.`
    )
  }

  return (
    options.weights.chroma * chromaScore +
    options.weights.contrast * contrastScore +
    options.weights.deuteranopia * deuteranopiaScore +
    options.weights.difference * differenceScore +
    options.weights.dispersion * dispersionScore +
    options.weights.hue * hueScore +
    options.weights.lightness * lightnessScore +
    options.weights.normal * normalScore +
    options.weights.protanopia * protanopiaScore +
    options.weights.tritanopia * tritanopiaScore
  )
}

const normalizeLightness = (
  value: Required<Exclude<OptimizeOptions['lightness'], undefined>>
): Required<Exclude<OptimizeOptions['lightness'], undefined>> => ({
  range: map(value.range, (value) => value / N) as [number, number],
  target: value.target / N
})

const normalizeChroma = (
  value: Required<Exclude<OptimizeOptions['chroma'], undefined>>
): Required<Exclude<OptimizeOptions['chroma'], undefined>> => ({
  range: map(value.range, (v) => (v / N) * 0.4) as [number, number],
  target: (value.target / N) * 0.4
})

const normalizeOptions = (
  options: OptimizeOptions
): RequiredOptimizeOptions => {
  const colors = map(options.colors, (colors) =>
    map(
      colors,
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

  const colorSpace = options.colorSpace === ColorSpaceId.p3 ? P3 : sRGB

  const hueAngle = normalizeAngle(options.hueAngle)

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const value = {
    weights: options.weights,
    colors,
    background,
    prng,
    hyperparameters: {
      temperature: 8000,
      coolingRate: 0.99,
      cutoff: 0.0001,
      ...options.hyperparameters
    },
    hueAngle,
    colorSpace,
    lightness: normalizeLightness({
      range: [0, N],
      target: mean(options.lightness?.range ?? [0, N]),
      ...options.lightness
    }),
    chroma: normalizeChroma({
      range: [0, N],
      target: mean(options.chroma?.range ?? [0, N]),
      ...options.chroma
    })
  } as RequiredOptimizeOptions

  ;(['lightness', 'chroma'] as const).forEach((key) => {
    if (
      !isWithin(value[key].target, value[key].range[0], value[key].range[1])
    ) {
      throw new Error(
        `${key} out of range: ${JSON.stringify([
          value[key].target,
          value[key].range[0],
          value[key].range[1]
        ])} ${JSON.stringify(options[key])}`
      )
    }
  })

  return value
}

const iterate = (options: RequiredOptimizeOptions) => {
  const colors: Color[] = map(options.colors, (colors) => {
    return randomColor(
      options,
      sample(colors, 1, () => options.prng.float())[0]
    )
  })

  const startColors: Color[] = colors.map((value) => clone(value))
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
      } catch (e) {}
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
    cost: bestCost,
    colors: map(bestColors, (value): [number, number, number] => value.coords)
  }
}

export const optimize = async (
  options: OptimizeOptions
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<OptimizationState> => {
  ColorSpace.register(LCH)
  ColorSpace.register(OKLCH)
  ColorSpace.register(sRGB)
  ColorSpace.register(P3)

  try {
    const normalizedOptions = normalizeOptions(options)

    return {
      type: TypeOptimizationState.Fulfilled,
      ...iterate(normalizedOptions)
    }
  } catch (e) {
    if (e instanceof IterationError) {
      return { type: TypeOptimizationState.Rejected }
    }

    console.error(e)

    throw e
  }
}
