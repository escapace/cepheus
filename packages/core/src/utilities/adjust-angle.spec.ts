import { assert } from 'chai'
import { adjustAngle } from './adjust-angle'

describe('./src/adjust-angle.spec.ts', () => {
  it('.', () => {
    assert.deepStrictEqual(adjustAngle(10, 20), [10, 20])
    assert.deepStrictEqual(adjustAngle(40, 380), [40, 20])
    assert.deepStrictEqual(adjustAngle(320, 80), [320, 440])
    assert.deepStrictEqual(adjustAngle(320, 440), [320, 440])
  })
})
