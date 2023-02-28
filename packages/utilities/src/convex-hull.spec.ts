import { assert } from 'chai'
import { convexHull } from './convex-hull'

describe('./src/utilities/convex-hull.spec.ts', () => {
  it('basic square', () => {
    const result = convexHull([
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1]
    ])

    assert.deepStrictEqual(result, [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0]
    ])
  })

  it('mixed square', () => {
    const result = convexHull([
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
      [0, 1],
      [1, 1],
      [0, 2],
      [1, 2],
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
      [1, 1],
      [2, 1],
      [1, 2],
      [2, 2]
    ])

    assert.deepStrictEqual(result, [
      [0, 0],
      [0, 2],
      [2, 2],
      [2, 0]
    ])
  })

  it('rectangle with inside points', () => {
    const result = convexHull([
      [1, 1],
      [3, 0],
      [2, 1],
      [3, 2],
      [1, 2],
      [0, 2],
      [0, 0]
    ])
    assert.deepStrictEqual(result, [
      [0, 0],
      [0, 2],
      [3, 2],
      [3, 0]
    ])
  })

  it('more complex shape', () => {
    const result = convexHull([
      [-1, -1],
      [0, 0],
      [0, -2],
      [1, 0],
      [1, 2],
      [4, 1],
      [0, 8],
      [3, 6],
      [2, 4]
    ])

    assert.deepStrictEqual(result, [
      [-1, -1],
      [0, 8],
      [3, 6],
      [4, 1],
      [0, -2]
    ])
  })

  it('already sorted', () => {
    const result = convexHull(
      [
        [0, 0],
        [0, 2],
        [1, 1],
        [1, 2],
        [2, 1],
        [3, 0],
        [3, 2]
      ],
      { sorted: true }
    )

    assert.deepStrictEqual(result, [
      [0, 0],
      [0, 2],
      [3, 2],
      [3, 0]
    ])
  })
})
