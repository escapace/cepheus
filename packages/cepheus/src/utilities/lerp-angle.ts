import { adjustAngle } from './adjust-angle'
import { lerp } from './lerp'
import { normalizeAngle } from './normalize-angle'

export const lerpAngle = (a: number, b: number, t: number) =>
  normalizeAngle(lerp(...adjustAngle(a, b), t))
