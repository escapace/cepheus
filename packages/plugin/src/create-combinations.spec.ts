import { assert, describe, it } from 'vitest'
import { createCombinations } from './create-combinations'

describe('src/combinations.spec.ts', () => {
  it('generates combinations for an empty object', () => {
    assert.deepEqual(createCombinations({}), [])
  })

  it('generates combinations for a partially empty object', () => {
    assert.deepEqual(
      createCombinations({
        x: [1, 2, 3],
        y: ['a', 'b'],
        z: [],
      }),
      [],
    )
  })

  it('generates combinations', () => {
    const object = {
      x: [1, 2, 3],
      y: ['a', 'b'],
      z: [20, 30],
    }
    const combos = createCombinations(object)
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
      { x: 3, y: 'b', z: 30 },
    ])
  })

  it('generates combinations', () => {
    const object = {
      x: [1, 2, 3],
      y: ['a', undefined],
    }
    const combos = createCombinations(object)

    assert.deepEqual(combos, [
      { x: 1, y: 'a' },
      { x: 2, y: 'a' },
      { x: 3, y: 'a' },
      { x: 1, y: undefined },
      { x: 2, y: undefined },
      { x: 3, y: undefined },
    ])
  })
})
