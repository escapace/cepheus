import { lerp } from './lerp'

export const lerpArray = (a: number[], b: number[], t: number): number[] => {
  const length = Math.min(a.length, b.length)
  const out: number[] = new Array<number>(length)

  for (let index = 0; index < length; index++)
    out[index] = lerp(a[index], b[index], t)

  return out
}
