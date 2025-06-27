import { describe, it, expect } from 'vitest'
import { ArrayMap } from './array-map'

describe('ArrayMap', () => {
  it('should store and retrieve values by numeric keys', () => {
    const keys = [0, 2, 5]
    const values = ['a', 'b', 'c']
    const map = new ArrayMap(keys, values)

    expect(map.get(0)).toBe('a')
    expect(map.get(2)).toBe('b')
    expect(map.get(5)).toBe('c')
  })

  it('should return undefined for non-existent keys', () => {
    const keys = [1, 3]
    const values = ['x', 'y']
    const map = new ArrayMap(keys, values)

    expect(map.get(0)).toBeUndefined()
    expect(map.get(2)).toBeUndefined()
    expect(map.get(4)).toBeUndefined()
  })

  it('should handle empty arrays', () => {
    expect(() => new ArrayMap([], [])).toThrow()
  })

  it('should handle single key-value pair', () => {
    const map = new ArrayMap([10], ['value'])
    expect(map.get(10)).toBe('value')
    expect(map.get(9)).toBeUndefined()
  })
})
