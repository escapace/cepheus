import { Deficiency, simulate as simulateDeficiency } from '@bjornlu/colorblind'
import { mean, medianAbsoluteDeviation, sample } from 'simple-statistics'
import {
  ColorSpace,
  convert,
  deltaEOK,
  contrast,
  clone,
  Color,
  inGamut
} from '../colorjs-io'
import { clamp } from '../utilities/clamp'
import { range, defaultsDeep } from 'lodash-es'
import type { DeepRequired } from 'utility-types'

function getRandomArbitrary(
  min: number,
  max: number,
  randomSource: () => number
) {
  return randomSource() * (max - min) + min
}

function between(x: number, min: number, max: number) {
  return x >= min && x <= max
}

// TODO: gamut

const randomNearbyColor = (color: Color, options: RequiredOptions): Color => {
  const next = (): Color => {
    const index = sample([0, 1, 2], 1, options.random)[0]

    const value = clone(color)

    switch (index) {
      case 0:
        value.coords[index] = percentile(
          value.coords[index],
          5,
          options.lightness.range[0],
          options.lightness.range[1],
          options.random
        )

        break
      case 1:
        value.coords[index] = percentile(
          value.coords[index],
          5,
          options.chroma.range[0],
          options.chroma.range[1],
          options.random
        )

        break
      case 2:
        value.coords[index] = percentile(
          value.coords[index],
          5,
          0,
          360,
          options.random
        )

        break
    }

    if (
      between(
        Math.abs(contrast(options.background, value, { algorithm: 'APCA' })),
        options.contrast.range[0],
        options.contrast.range[1]
      ) &&
      inGamut(value, options.colorSpace)
    ) {
      return value
    } else {
      return next()
    }
  }

  return next()
}

const randomColor = (options: RequiredOptions): Color => {
  const value = {
    space: ColorSpace.get('oklch'),
    coords: [
      getRandomArbitrary(
        options.lightness.range[0],
        options.lightness.range[1],
        options.random
      ),
      getRandomArbitrary(
        options.chroma.range[0],
        options.chroma.range[1],
        options.random
      ),
      getRandomArbitrary(-0.4, 0.4, options.random)
    ],
    alpha: 1
  }

  if (
    between(
      Math.abs(contrast(options.background, value, { algorithm: 'APCA' })),
      options.contrast.range[0],
      options.contrast.range[1]
    ) &&
    inGamut(value, options.colorSpace)
  ) {
    return value
  } else {
    return randomColor(options)
  }
}

const distance = (a: Color, b: Color) => deltaEOK(a, b)

// const getClosestColor = (color, colorArray) => {
//   const distances = colorArray.map((c) => distance(color, c))
//   const minIndex = distances.indexOf(Math.min(...distances))
//   return colorArray[minIndex]
// }

const distances = (colors: Color[], deficiency?: Deficiency) => {
  const distances: number[] = []

  const convertedColors = colors.map((color) => {
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
        coords: [r, g, b].map((value) => value / 255.0),
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

  return distances.sort((a, b) => a - b)
}

// Cost function including weights
const cost = (state: Color[], options: RequiredOptions) => {
  const div = 100

  const targetWeight = 50 / div

  const medianAbsoluteDeviationWeight = 30 / div
  const normalWeight = 5 / div
  const protanopiaWeight = 5 / div
  const deuteranopiaWeight = 5 / div
  const tritanopiaWeight = 5 / div

  const normalDistances = distances(state)
  const protanopiaDistances = distances(state, 'protanopia')
  const deuteranopiaDistances = distances(state, 'deuteranopia')
  const tritanopiaDistances = distances(state, 'tritanopia')

  // reward the increase in central tendency of distances between colors
  const normalScore = 1 - mean(normalDistances)
  const protanopiaScore = 1 - mean(protanopiaDistances)
  const deuteranopiaScore = 1 - mean(deuteranopiaDistances)
  const tritanopiaScore = 1 - mean(tritanopiaDistances)

  // average of the distance from target colors
  const targetScore = mean(
    state
      .map((c, index) => distance(c, options.colors[index]))
      .sort((a, b) => a - b)
  )

  // TODO: contrast score

  const colorWeights =
    normalWeight + protanopiaWeight + deuteranopiaWeight + tritanopiaWeight

  // const medianAbsoluteDeviationScore = 100 - medianAbsoluteDeviation(normalDistances)

  // medianAbsoluteDeviation() increases with the variability of colors
  // 1 - medianAbsoluteDeviation() decreases with the variability of colors
  const medianAbsoluteDeviationScore =
    1 -
    mean(
      [
        [normalDistances, normalWeight / colorWeights] as const,
        [protanopiaDistances, protanopiaWeight / colorWeights] as const,
        [deuteranopiaDistances, deuteranopiaWeight / colorWeights] as const,
        [tritanopiaDistances, tritanopiaWeight / colorWeights] as const
      ].flatMap(([value, weight]) => medianAbsoluteDeviation(value) * weight)
    )

  if (
    [
      normalScore,
      protanopiaScore,
      deuteranopiaScore,
      tritanopiaScore,
      medianAbsoluteDeviationScore,
      targetScore
    ].some((value) => value > 1 || value < 0 || isNaN(value))
  ) {
    console.log({
      normalScore,
      protanopiaScore,
      deuteranopiaScore,
      tritanopiaScore,
      medianAbsoluteDeviationScore,
      targetScore
    })

    throw new Error('Out of bounds.')
  }

  return (
    targetWeight * targetScore +
    medianAbsoluteDeviationWeight * medianAbsoluteDeviationScore +
    normalWeight * normalScore +
    protanopiaWeight * protanopiaScore +
    deuteranopiaWeight * deuteranopiaScore +
    tritanopiaWeight * tritanopiaScore
  )
}

const percentile = (
  current: number,
  percent: number,
  min: number,
  max: number,
  randomSource: () => number
) => {
  const value = (percent / 100.0) * (max - min)

  return clamp(
    current + getRandomArbitrary(-1.0 * value, value, randomSource),
    min,
    max
  )
}

interface Options {
  random: () => number
  colors: Color[]
  background: Color
  colorSpace?: ColorSpace
  lightness?: {
    // Lightness [0, 1]
    range?: [number, number]
  }
  chroma?: {
    // Chroma [0, 0.4]
    range?: [number, number]
  }
  contrast?: {
    // APCA [0, 106]
    range?: [number, number]
  }
}

type RequiredOptions = DeepRequired<Options>

export const optimize = (options: Options) => {
  const opts = defaultsDeep({}, options, {
    colorSpace: ColorSpace.get('p3'),
    lightness: {
      range: [0, 1],
      ...options.lightness
    },
    chroma: {
      range: [0, 0.4],
      ...options.chroma
    },
    contrast: {
      range: [70, 100],
      ...options.contrast
    },
    ...options,
    colors: options.colors.map((value) =>
      convert(value, 'oklch', { inGamut: true })
    ),
    background: convert(options.background, 'oklch', { inGamut: true })
  }) as RequiredOptions

  const n = opts.colors.length

  const colors: Color[] = range(n).map(() => randomColor(opts))

  const startColors = Array.from(colors)
  const startCost = cost(startColors, opts)

  // intialize hyperparameters
  let temperature = 1000
  const coolingRate = 0.99
  const cutoff = 0.0001

  // iteration loop
  while (temperature > cutoff) {
    // for each color
    for (let i = 0; i < colors.length; i++) {
      // copy old colors
      const newColors = [...colors]
      // move the current color randomly
      newColors[i] = randomNearbyColor(newColors[i], opts)
      // choose between the current state and the new state
      // based on the difference between the two, the temperature
      // of the algorithm, and some random chance
      const delta = cost(newColors, opts) - cost(colors, opts)
      const probability = Math.exp(-delta / temperature)
      if (opts.random() < probability) {
        colors[i] = newColors[i]
      }
    }

    console.log(`Current cost: ${cost(colors, opts)}`)

    // decrease temperature
    temperature *= coolingRate
  }

  console.log(
    `${((1 - cost(colors, opts) / startCost) * 100).toFixed(2)}% Optimized`
  )

  return colors
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
