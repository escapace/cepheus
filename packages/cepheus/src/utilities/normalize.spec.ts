import { assert, describe, it } from 'vitest'
import { normalize } from './normalize'

describe('./src/normalize.spec.ts', () => {
  it('.', () => {
    assert.deepEqual(normalize([2, 2]), [0.5, 0.5])
    assert.deepEqual(normalize([1, 1]), [0.5, 0.5])
  })
})
