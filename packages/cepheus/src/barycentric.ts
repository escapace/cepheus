import { cartesian } from './cartesian'
import { INTERPOLATOR } from './constants'
import type { Interpolator } from './types'
import { normalize } from './utilities/normalize'

export const barycentric = (
  interpolator: Interpolator,
  color: number,
  alpha: number,
  beta: number,
  gamma: number,
  invert = false,
) => {
  const { triangle } = interpolator[INTERPOLATOR]
  const [t0, t1, t2] = triangle

  const aa = invert ? gamma : alpha
  const gg = invert ? alpha : gamma

  const [a, b, g] = normalize([aa, beta, gg])

  const x = a * t0[0] + b * t1[0] + g * t2[0]
  const y = a * t0[1] + b * t1[1] + g * t2[1]

  return cartesian(interpolator, color, x, y)
}
