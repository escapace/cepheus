import { assert } from 'chai'
import { szudzik } from './szudzik'

describe('./src/szudzik.spec.ts', () => {
  it('.', () => {
    assert.equal(szudzik(1, 1), 3)
  })
})
