import { CEPHEUS_SIDE_LENGTH as N } from 'cepheus'
import { assert, describe, expect, it } from 'vitest'
import { tile } from './tile'
import { toPosition } from './to-position'

describe('./src/tile.spec.ts', () => {
  it('.', () => {
    assert.deepEqual(tile(N / 2), [0, 1, 2, 3])
    expect(tile(N / 3).map((square) => toPosition(square, N / 3))).toMatchSnapshot()
  })
})
