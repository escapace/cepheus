import { toPosition } from '@cepheus/utilities'
import { range } from 'lodash-es'
import { N } from '../constants'
import type { Square } from '../types'
import { parametricLogisticLift } from '../utilities/parametric-logistic-lift'
import { toPrecision } from '../utilities/to-precision'

export function createSquareOptions(
  square: Square,
  interval: number,
): {
  chroma: { range: [number, number]; target: number }
  lightness: { range: [number, number]; target: number }
} {
  const position = toPosition(square, interval)

  const [lightness, chroma] = range(2).map((_, index) => {
    const isLightness = index === 0
    const range = [position[index], position[index] + interval] as [number, number]

    const [inputMin, inputMax] = range
    // Calculate distances from input range boundaries to wide range boundaries
    const minDistanceToWideMin = Math.abs(inputMin)
    const maxDistanceToWideMax = Math.abs(inputMax - N)

    // Choose the boundary that's closer to its respective wide range boundary
    let delta = (minDistanceToWideMin <= maxDistanceToWideMax ? inputMin : inputMax) / N

    const reverse = delta >= 0.5
    delta = reverse ? 1 - delta : delta

    delta = parametricLogisticLift(
      delta,
      isLightness ? (reverse ? 80 : 40) : 40,
      isLightness ? (reverse ? 0.2 : 0.025) : (reverse ? 0.8 : 0.025),
    )
    delta = reverse ? 1 - delta : delta

    const target = toPrecision(inputMin + (inputMax - inputMin) * delta, 6)

    return {
      range,
      target,
    }
  })

  return {
    chroma,
    lightness,
  }
}

// import { tile } from '@cepheus/utilities'
// tile(5).map(value => console.log(createSquareOptions(value, 5)))
