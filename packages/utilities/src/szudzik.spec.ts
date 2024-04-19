import { assert } from 'chai'
import { szudzik, unszudzik } from './szudzik'

describe('./src/szudzik.spec.ts', () => {
  it('.', () => {
    assert.equal(szudzik(1, 1), 3)
    assert.equal(szudzik(100, 100), 10_200)
    assert.equal(szudzik(100, 100, 99), 104_050_299)
    assert.deepEqual(unszudzik(szudzik(100, 100, 99), 3), [100, 100, 99])
    assert.deepEqual(unszudzik(szudzik(1, 2), 2), [1, 2])
    assert.deepEqual(
      unszudzik(szudzik(1, 2, 3, 4, 5, 6), 6),
      [1, 2, 3, 4, 5, 6]
    )

    assert.equal(szudzik(100, 100, 100), 104_050_300)
  })
})
