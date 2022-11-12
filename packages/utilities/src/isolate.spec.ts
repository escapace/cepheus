import { assert } from 'chai'
import { N } from './constants'
import { isolate } from './isolate'
import { toPosition } from './to-position'
import { toSquare } from './to-square'

describe('./src/isolate.spec.ts', () => {
  it('.', () => {
    const interval = N / 3

    const groupA = [
      [0, 0],
      [0, 40]
    ]

    const groupB = [
      [40, 80],
      [80, 80],
      [80, 40]
    ]

    assert.deepEqual(
      isolate(
        [...groupA, ...groupB].map((position) =>
          toSquare(position as [number, number], interval)
        ),
        interval,
        false
      ).map((value) => value.map((value) => toPosition(value, interval))),
      [groupB, groupA]
    )
  })

  it('.', () => {
    const interval = N / 3

    const groupA = [[0, 0]]

    const groupB = [
      [40, 80],
      [80, 80],
      [80, 40]
    ]

    assert.deepEqual(
      isolate(
        [...groupA, ...groupB].map((position) =>
          toSquare(position as [number, number], interval)
        ),
        interval,
        true
      ).map((value) => value.map((value) => toPosition(value, interval))),
      [groupB, groupA]
    )
  })
})
