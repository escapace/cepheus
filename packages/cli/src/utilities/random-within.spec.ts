/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { assert } from 'chai'
import type { PRNG } from './create-prng'
import { randomWithin } from './random-within'

const one = {
  float: () => 1
} as PRNG

const half = {
  float: () => 0.5
} as PRNG

const zero = {
  float: () => 0
} as PRNG

describe('./src/utilities/random-within.spec.ts', () => {
  it('.', () => {
    assert.equal(randomWithin(0, 100, one), 100)
    assert.equal(randomWithin(0, 100, half), 50)
    assert.equal(randomWithin(0, 100, zero), 0)

    assert.equal(randomWithin(-50, 50, one), 50)
    assert.equal(randomWithin(-50, 50, half), 0)
    assert.equal(randomWithin(-50, 50, zero), -50)
  })
})
