import fnv1a from '@sindresorhus/fnv1a'
import { SFC32, Xoshiro128, XorShift128, XorWow } from '@thi.ng/random'
import type { ValuesType } from 'utility-types'

const RANDOM_SOURCES = {
  'xoshiro128++': Xoshiro128,
  xorshift128: XorShift128,
  xorwow: XorWow,
  sfc32: SFC32
}

export type PRNGName = keyof typeof RANDOM_SOURCES
export type PRNG = InstanceType<ValuesType<typeof RANDOM_SOURCES>>

const EMPTY_FNV1A = Number(fnv1a('', { size: 32 }))

export const split = (string: string) => {
  const chunkSize = Math.ceil(string.length / 4)
  const hashes: number[] = []

  for (let i = 0; i < string.length; i += chunkSize) {
    hashes.push(Number(fnv1a(string.slice(i, i + chunkSize), { size: 32 })))
  }

  for (let i = 0; i < 4; i += 1) {
    if (hashes[i] === undefined) {
      hashes[i] = EMPTY_FNV1A
    }
  }

  return hashes
}

export const createPRNG = (
  randomSeed: string,
  randomSource: PRNGName = 'xoshiro128++'
): PRNG => {
  return new RANDOM_SOURCES[randomSource](split(randomSeed))
}
