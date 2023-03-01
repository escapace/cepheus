import { LENGTH as N } from 'cepheus'
import { assert } from 'chai'
import { tile } from './tile'
import { toPosition } from './to-position'

describe('./src/tile.spec.ts', () => {
  it('.', () => {
    assert.deepEqual(tile(N / 2), [3, 5, 7, 8])
    assert.deepStrictEqual(
      tile(N / 3).map((square) => toPosition(square, N / 3)),
      [
        [50, 80],
        [80, 70],
        [120, 70],
        [50, 120],
        [90, 120],
        [120, 110],
        [50, 160],
        [90, 160],
        [130, 160]
      ]
    )
  })
})
