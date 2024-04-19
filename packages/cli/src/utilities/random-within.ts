import type { PRNG } from './create-prng'

export const randomWithin = (min: number, max: number, prng: PRNG) =>
  prng.float() * (max - min) + min
