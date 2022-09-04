import { Deficiency, simulate as simulateDeficiency } from '@bjornlu/colorblind'
import { mean, sample, sum, variance } from 'simple-statistics'
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
import { map, range, mapValues, flatMap, defaultsDeep } from 'lodash-es'
import type { DeepRequired } from 'utility-types'
import { relativeDifference } from '../utilities/relative-difference'

// TODO: assert

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
const cost = (state: Color[], options: RequiredOptions) => {
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

export const optimize = (options: Options) => {
  const opts = defaultsDeep(
    {
      ...options,
      colors: options.colors.map((value) =>
        convert(value, 'oklch', { inGamut: true })
      ),
      background: convert(options.background, 'oklch', { inGamut: true })
    },
    {
      weights: normalizeWeights({
        difference: 100,
        dispersion: 40,
        // coords
        lightness: 10,
        chroma: 10,
        contrast: 10,
        // color-vision
        normal: 15,
        protanopia: 5,
        tritanopia: 5,
        deuteranopia: 5,
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
    if (!between(opts[key].target, opts[key].range[0], opts[key].range[1])) {
      throw new Error(`${key} out of range`)
    }
  })

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
