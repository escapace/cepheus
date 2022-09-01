import { clamp } from './clamp'
import { assert } from 'chai'

describe('./src/utilities/clamp.spec.ts', () => {
  it('clamp', () => {
    assert.equal(clamp(0.3, -0.4, 0.4), 0.3)
    assert.equal(clamp(-0.3, -0.4, 0.4), -0.3)
    assert.equal(clamp(1, -0.4, 0.4), 0.4)
    assert.equal(clamp(-1, -0.4, 0.4), -0.4)
  })
})
