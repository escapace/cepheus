import { assert, describe, it } from 'vitest'
import { szudzik } from './szudzik'

describe('./src/szudzik.spec.ts', () => {
  it('.', () => {
    assert.equal(szudzik(1, 1), 3)
  })
})
