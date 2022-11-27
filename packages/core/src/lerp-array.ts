import { lerp } from './lerp'

export const lerpArray = (a: number[], b: number[], t: number): number[] => {
  const len = Math.min(a.length, b.length)
  const out: number[] = []

  for (let i = 0; i < len; i++) out[i] = lerp(a[i], b[i], t)

  return out
}
