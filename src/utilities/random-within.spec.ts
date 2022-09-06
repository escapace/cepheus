import { assert } from 'chai'
import { randomWithin } from './random-within'

describe('./src/utilities/random-within.spec.ts', () => {
  it('.', () => {
    assert.equal(
      randomWithin(100, 200, () => 0.5),
      150
    )

    assert.equal(randomWithin(0.1, 0.2, () => 0.5).toFixed(2), '0.15')
  })
})
