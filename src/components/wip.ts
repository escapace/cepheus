import { Deficiency, simulate as simulateDeficiency } from '@bjornlu/colorblind'
import type { Color } from '../colorjs-io'
import Rand, { PRNG } from 'rand-seed'
import { mean, medianAbsoluteDeviation } from 'simple-statistics'
import { ColorSpace, convert, deltaEOK } from '../colorjs-io'
import { clamp } from '../utilities/clamp'

const prng = new Rand(
  'jkasdjkhqwekqwwehrjkwe1hasd23123e1asfahjkdhqwehkjqwehhhhqwjehkqwehhhkjhkhhaskdjak23yuhjkw',
  PRNG.xoshiro128ss
)

const randomFromArray = <T>(array: T[]): T => {
  return array[Math.floor(prng.next() * array.length)]
}

function getRandomArbitrary(min: number, max: number) {
  return prng.next() * (max - min) + min
}

const randomColor = (): Color => ({
  space: ColorSpace.get('oklab'),
  coords: [
    prng.next(),
    getRandomArbitrary(-0.4, 0.4),
    getRandomArbitrary(-0.4, 0.4)
  ],
  alpha: 1
})

// const distanceSquared = (a, b) => {
//   let sum = 0
//   let n
//   for (n = 0; n < a.length; n++) {
//     sum += Math.pow(a[n] - b[n], 2)
//   }
//
//   return sum
// }

// const distance = (a, b) => {
//   return Math.sqrt(distanceSquared([a.l, a.a, a.b], [b.l, b.a, b.b]))
// }

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
      'oklab',
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
const cost = (state: Color[], targetColors: Color[]) => {
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
      .map((c, index) => distance(c, targetColors[index]))
      .sort((a, b) => a - b)
  )

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
  max: number
) => {
  const value = (percent / 100.0) * (max - min)

  return clamp(current + getRandomArbitrary(-1.0 * value, value), min, max)
}

const randomNearbyColor = (color: Color): Color => {
  const index = randomFromArray([0, 1, 2])
  // const index = randomFromArray(['l', 'c', 'h'])

  const value = convert(color, ColorSpace.get('oklch'), { inGamut: true })
  // const value = clone(color)

  switch (index) {
    case 0:
      value.coords[index] = percentile(value.coords[index], 5, 0, 1)

      break
    case 1:
      // value.coords[index] = percentile(value.coords[index], 5, -0.4, 0.4)
      value.coords[index] = percentile(value.coords[index], 5, 0, 0.4)
      // value.c = percentile(value.c, 5, 0, 0.4)

      break
    case 2:
      // value.coords[index] = percentile(value.coords[index], 5, -0.4, 0.4)
      value.coords[index] = percentile(value.coords[index], 5, 0, 360)
      // value.h = percentile(value.h, 5, 0, 360)

      break
  }

  // return value.to('oklab', { inGamut: true})
  // return value
  return convert(value, 'oklab', { inGamut: true })
}

export const optimize = (_targetColors: Color[]) => {
  const targetColors = _targetColors.map((value) =>
    convert(value, 'oklab', { inGamut: true })
  )

  const n = targetColors.length

  const colors: Color[] = []
  for (let i = 0; i < n; i++) {
    colors.push(randomColor())
  }

  const startColors = Array.from(colors)
  const startCost = cost(startColors, targetColors)

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
      newColors[i] = randomNearbyColor(newColors[i])
      // choose between the current state and the new state
      // based on the difference between the two, the temperature
      // of the algorithm, and some random chance
      const delta = cost(newColors, targetColors) - cost(colors, targetColors)
      const probability = Math.exp(-delta / temperature)
      if (prng.next() < probability) {
        colors[i] = newColors[i]
      }
    }

    console.log(`Current cost: ${cost(colors, targetColors)}`)

    // decrease temperature
    temperature *= coolingRate
  }

  console.log(
    `${((1 - cost(colors, targetColors) / startCost) * 100).toFixed(
      2
    )}% Optimized`
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
