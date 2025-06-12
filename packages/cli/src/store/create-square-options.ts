import { toPosition } from '@cepheus/utilities'
import { range } from 'lodash-es'
import type { OptimizeTaskOptions, Square } from '../types'
import { toPrecision } from '../utilities/to-precision'

const WIDE_MIN = 0
const WIDE_MAX = 120

export function logisticLift(x: number): number {
  // ---- guard clause -------------------------------------------------------
  // Clamp the input to the legal domain so callers don’t have to.
  if (x <= 0) return 0
  if (x >= 0.5) return 0.5

  // ---- helper: logistic sigmoid ------------------------------------------
  const sigma = (z: number): number => 1 / (1 + Math.exp(-z))

  // Pre-compute the constant denominator 1 − σ(−4)
  // (σ(−4) ≈ 0.01799…, stored once for speed and numeric stability)
  const SIGMA_NEG4 = 1 / (1 + Math.exp(4)) // ≈ 0.01798620996209156
  const DENOM = 1 - SIGMA_NEG4 // ≈ 0.9820137900379084

  // ---- lift term L(x) -----------------------------------------------------
  const lift = (sigma(40 * (x - 0.1)) - SIGMA_NEG4) / DENOM

  // ---- final value --------------------------------------------------------
  return x + (0.5 - x) * lift
}

const adjustDelta = (delta: number) => {
  const flip = delta >= 0.5

  const x = logisticLift(flip ? 1 - delta : delta)

  return flip ? 1 - x : x
}

function mapRangeToValue(input: [number, number]): number {
  const [inputMin, inputMax] = input
  // Calculate distances from input range boundaries to wide range boundaries
  const minDistanceToWideMin = Math.abs(inputMin - WIDE_MIN)
  const maxDistanceToWideMax = Math.abs(inputMax - WIDE_MAX)

  // Choose the boundary that's closer to its respective wide range boundary
  const chosenValue = minDistanceToWideMin <= maxDistanceToWideMax ? inputMin : inputMax

  // Map the chosen value to [0, 1] based on its position in the wide range
  const delta = adjustDelta((chosenValue - WIDE_MIN) / (WIDE_MAX - WIDE_MIN))

  return inputMin + (inputMax - inputMin) * delta
}

export function createSquareOptions(
  square: Square,
  interval: number,
): Required<Pick<OptimizeTaskOptions, 'chroma' | 'lightness'>> {
  const position = toPosition(square, interval)

  const [lightness, chroma] = range(2).map((_, index) => {
    const range = [position[index], position[index] + interval] as [number, number]

    const target = toPrecision(mapRangeToValue(range), 6)

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
