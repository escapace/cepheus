import { assert } from 'chai'
import { xor } from './xor'

describe('./src/xor.spec.ts', () => {
  it('.', () => {
    assert.equal(xor(false, false), false)
    assert.equal(xor(false, true), true)
    assert.equal(xor(true, false), true)
    assert.equal(xor(true, true), false)
  })
})
