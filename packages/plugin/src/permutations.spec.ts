import { assert } from 'chai'
import { permutations } from './permutations'

describe('src/permutations.spec.ts', () => {
  it('generates permutations for an empty object', () => {
    assert.deepEqual(permutations({}), [])
  })

  it('generates permutations for a partially empty object', () => {
    assert.deepEqual(
      permutations({
        x: [1, 2, 3],
        y: ['a', 'b'],
        z: []
      }),
      []
    )
  })

  it('generates permutations', () => {
    const object = {
      x: [1, 2, 3],
      y: ['a', 'b'],
      z: [20, 30]
    }
    const combos = permutations(object)
    assert.deepEqual(combos, [
      { x: 1, y: 'a', z: 20 },
      { x: 2, y: 'a', z: 20 },
      { x: 3, y: 'a', z: 20 },
      { x: 1, y: 'b', z: 20 },
      { x: 2, y: 'b', z: 20 },
      { x: 3, y: 'b', z: 20 },
      { x: 1, y: 'a', z: 30 },
      { x: 2, y: 'a', z: 30 },
      { x: 3, y: 'a', z: 30 },
      { x: 1, y: 'b', z: 30 },
      { x: 2, y: 'b', z: 30 },
      { x: 3, y: 'b', z: 30 }
    ])
  })
})
