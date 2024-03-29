import { assert } from 'chai'
import { LENGTH as N } from 'cepheus'
import { toPosition } from './to-position'
import { toSquare } from './to-square'

describe('./src/to-position.spec.ts', () => {
  it('.', () => {
    const interval = N / 3

    assert.deepEqual(toPosition(toSquare([0, 40], interval), interval), [0, 40])
  })
})
