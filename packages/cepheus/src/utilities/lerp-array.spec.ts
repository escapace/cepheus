import { assert } from 'chai'
import { lerpArray } from './lerp-array'

describe('./src/lerp.spec.ts', () => {
  it('.', () => {
    // assert.equal(lerpArray(0, 1, 0.5), 0.5)
    // assert.equal(lerpArray(-1, 1, 0.5), 0.0)
    assert.deepEqual(lerpArray([0, -1], [1, 1], 0.5), [0.5, 0])
    assert.deepEqual(lerpArray([0, -1, 5], [1, 1], 0.5), [0.5, 0])
  })
})
