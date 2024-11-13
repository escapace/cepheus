import { assert, describe, it } from 'vitest'
import { normalizeAngle } from './normalize-angle'

describe('./src/normalize-angle.spec.ts', () => {
  it('.', () => {
    assert.equal(normalizeAngle(360), 0)
    assert.equal(normalizeAngle(361), 1)
    assert.equal(normalizeAngle(-1), 359)
  })
})
