import { assert, describe, it } from 'vitest'
import { chunk } from './chunk'

describe('./src/chunk.spec.ts', () => {
  it('.', () => {
    assert.deepStrictEqual(chunk([1, 2, 3, 4, 5, 6], 3), [
      [1, 2, 3],
      [4, 5, 6],
    ])
  })
})
