import { N } from '../constants'
import type { OptimizeTaskOptions } from '../types'
import { toPrecision } from './to-precision'

function calculateValues(x: number, delta = 0.2): number[] {
  if (x < 0 || x > 1) {
    throw new Error(`Input must be between 0 and 1, got ${x}.`)
  }

  const A = 0.55
  const n = 3.458

  const a = A * Math.pow(x, n)
  const b = 1 - A * Math.pow(1 - x, n)

  return [a, b].filter((value) => Math.abs(x - value) > delta)
}

export const calculateBackground = (...lightness: number[]): OptimizeTaskOptions['background'] =>
  lightness.flatMap((l) =>
    calculateValues(l / N).map((l): [number, number, number] => [toPrecision(l, 4), 0, 0]),
  )
