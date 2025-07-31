import { normalize } from 'coastal'
import { cartesian } from './cartesian'
import { CEPHEUS_INTERPOLATOR } from './constants'
import type { Interpolator } from './types'

export const barycentric = (
  interpolator: Interpolator,
  color: number,
  alpha: number,
  beta: number,
  gamma: number,
  invert = false,
  extended = false,
) => {
  const { triangle } = interpolator[CEPHEUS_INTERPOLATOR].references[extended ? color + 1 : 0]
  const [t0, t1, t2] = triangle

  const aa = invert ? gamma : alpha
  const gg = invert ? alpha : gamma

  const [a, b, g] = normalize([aa, beta, gg])

  const x = a * t0[0] + b * t1[0] + g * t2[0]
  const y = a * t0[1] + b * t1[1] + g * t2[1]

  return cartesian(interpolator, color, x, y)
}
