import { assert } from 'chai'
import { N } from './constants'
import { neighbours } from './neighbours'
import { toPosition } from './to-position'
import { toSquare } from './to-square'

describe('./src/neighbours.spec.ts', () => {
  it('.', () => {
    const interval = N / 3

    assert.deepEqual(
      neighbours(toSquare([40, 40], interval), interval, false)
        .filter((value): value is number => value !== undefined)
        .map((square) => toPosition(square, N / 3)),
      [
        [40, 80],
        [80, 40],
        [40, 0],
        [0, 40]
      ]
    )

    assert.deepEqual(
      neighbours(toSquare([40, 40], interval), interval, true)
        .filter((value): value is number => value !== undefined)
        .map((square) => toPosition(square, N / 3)),
      [
        [40, 80],
        [80, 80],
        [80, 40],
        [80, 0],
        [40, 0],
        [0, 0],
        [0, 40],
        [0, 80]
      ]
    )

    assert.deepEqual(
      neighbours(toSquare([0, 0], interval), interval, false)
        .filter((value): value is number => value !== undefined)
        .map((square) => toPosition(square, N / 3)),
      [
        [0, 40],
        [40, 0]
      ]
    )

    assert.deepEqual(
      neighbours(toSquare([80, 80], interval), interval, false)
        .filter((value): value is number => value !== undefined)
        .map((square) => toPosition(square, N / 3)),
      [
        [80, 40],
        [40, 80]
      ]
    )
  })
})
