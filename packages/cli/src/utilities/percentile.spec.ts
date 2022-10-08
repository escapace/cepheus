/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { assert } from 'chai'
import { constrainAngle } from './constrain-angle'
import { PRNG } from './create-prng'
import { percentile } from './percentile'

const one = {
  float: () => 1
} as PRNG

const half = {
  float: () => 0.5
} as PRNG

const zero = {
  float: () => 0
} as PRNG

describe('./src/utilities/percentlie.spec.ts', () => {
  it('.', () => {
    assert.equal(percentile(100, 0.1, 0, 100, one), 100)
    assert.equal(percentile(100, 0.1, 0, 100, half), 100)
    assert.equal(percentile(100, 0.1, 0, 100, zero), 90)

    assert.equal(percentile(75, 0.1, 0, 100, one), 85)
    assert.equal(percentile(75, 0.1, 0, 100, half), 75)
    assert.equal(percentile(75, 0.1, 0, 100, zero), 65)

    assert.equal(percentile(50, 0.1, 0, 100, one), 60)
    assert.equal(percentile(50, 0.1, 0, 100, half), 50)
    assert.equal(percentile(50, 0.1, 0, 100, zero), 40)

    assert.equal(percentile(25, 0.1, 0, 100, one), 35)
    assert.equal(percentile(25, 0.1, 0, 100, half), 25)
    assert.equal(percentile(25, 0.1, 0, 100, zero), 15)

    assert.equal(percentile(0, 0.1, 0, 100, one), 10)
    assert.equal(percentile(0, 0.1, 0, 100, half), 0)
    assert.equal(percentile(0, 0.1, 0, 100, zero), 0)

    assert.equal(constrainAngle(percentile(0, 0.1, -30, 30, one)), 6)
    assert.equal(constrainAngle(percentile(0, 0.1, -30, 30, half)), 0)
    assert.equal(constrainAngle(percentile(0, 0.1, -30, 30, zero)), 354)
  })
})
