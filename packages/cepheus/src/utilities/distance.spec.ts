import { assert } from 'chai'
import { distance } from './distance'

describe('./src/distance.spec.ts', () => {
  it('.', () => {
    assert.equal(distance(-7, -4, 17, 6), 34)
    assert.equal(distance(-7, -3, 0, 0), 10)
  })
})
