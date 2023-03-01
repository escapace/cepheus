import { lerp } from 'cepheus'
import { N } from '../constants'
import { bezier } from './bezier'
import { clamp } from './clamp'
import { toPrecision } from './to-precision'

// Another way to do this is to add white, rather than black
// and it will be less destructive
// https://www.desmos.com/calculator/gt8r5zedkw

// https://www.desmos.com/calculator/njdmqsw1ft
const curve = bezier(0, 0.5, 0, 0)

export const lightnessScalingFunction = (value: number) => {
  const t = clamp(value / N, 0, 1)

  return toPrecision(curve(lerp(0.05, 1, t)))
}

// range(0, 121).forEach((value) => {
//   console.log(value, lightnessScalingFunction(value))
// })
