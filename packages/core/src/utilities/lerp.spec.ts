import { assert } from 'chai'
import { lerp } from './lerp'

describe('./src/lerp.spec.ts', () => {
  it('.', () => {
    assert.equal(lerp(0, 100, 0.5), 50)
    assert.equal(lerp(0, 100, 0), 0)
    assert.equal(lerp(0, 100, 1), 100)
    assert.equal(lerp(0, 100, 1.5), 150)
  })
})
