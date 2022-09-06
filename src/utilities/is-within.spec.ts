import { assert } from 'chai'
import { isWithin } from './is-within'

describe('./src/utilities/is-within.spec.ts', () => {
  it('.', () => {
    assert.isTrue(isWithin(15, 10, 20))
    assert.isTrue(isWithin(10, 10, 20))
    assert.isTrue(isWithin(20, 10, 20))
    assert.isFalse(isWithin(25, 10, 20))
    assert.isFalse(isWithin(5, 10, 20))
  })
})
