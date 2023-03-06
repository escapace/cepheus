import { assert } from 'chai'
import { lerpAngle } from './lerp-angle'

describe('./src/lerp-angle.spec.ts', () => {
  it('.', () => {
    assert.deepStrictEqual(lerpAngle(10, 20, 0.5), 15)
    assert.deepStrictEqual(lerpAngle(40, 380, 0.5), 30)
    assert.deepStrictEqual(lerpAngle(320, 80, 1), 80) // [320, 440]
    assert.deepStrictEqual(lerpAngle(440, 320, 1), 320)
    assert.deepStrictEqual(lerpAngle(440, 320, 0), 80)
  })
})
