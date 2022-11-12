import { assert } from 'chai'
import { N } from './constants'
import { tile } from './tile'
import { toPosition } from './to-position'

describe('./src/tile.spec.ts', () => {
  it('.', () => {
    assert.deepEqual(tile(N / 2), [0, 1, 2, 3])
    assert.deepEqual(
      tile(N / 3).map((square) => toPosition(square, N / 3)),
      [
        [0, 0],
        [0, 40],
        [0, 80],
        [40, 0],
        [40, 40],
        [40, 80],
        [80, 0],
        [80, 40],
        [80, 80]
      ]
    )
  })
})
