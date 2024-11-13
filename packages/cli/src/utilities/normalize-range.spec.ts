import { describe, expect, it } from 'vitest'
import { normalizeRange } from './normalize-range' // Adjust import path as needed

const expectArraysClose = (actual: [number, number], expected: [number, number]) => {
  expect(actual[0]).toBeCloseTo(expected[0], 6)
  expect(actual[1]).toBeCloseTo(expected[1], 6)
}

describe('normalizeRange', () => {
  // Helper function to compare arrays of numbers with precision

  // Basic functionality tests
  it('should return the same range when tolerance is 1', () => {
    expectArraysClose(normalizeRange([0.2, 0.4], 1), [0.2, 0.4])
    expectArraysClose(normalizeRange([0, 1], 1), [0, 1])
  })

  it('should scale range symmetrically when possible', () => {
    expectArraysClose(normalizeRange([0.4, 0.6], 2), [0.3, 0.7])
    expectArraysClose(normalizeRange([0.3, 0.5], 2), [0.2, 0.6])
  })

  // Boundary tests
  it('should handle ranges at the lower boundary', () => {
    expectArraysClose(normalizeRange([0, 0.2], 2), [0, 0.4])
    expectArraysClose(normalizeRange([0, 0.1], 3), [0, 0.3])
  })

  it('should handle ranges at the upper boundary', () => {
    expectArraysClose(normalizeRange([0.8, 1], 2), [0.6, 1])
    expectArraysClose(normalizeRange([0.9, 1], 3), [0.7, 1])
  })

  // Edge cases
  it('should handle zero-width ranges', () => {
    expectArraysClose(normalizeRange([0.5, 0.5], 2), [0.5, 0.5])
    expectArraysClose(normalizeRange([0.3, 0.3], 3), [0.3, 0.3])
  })

  it('should handle full range', () => {
    expectArraysClose(normalizeRange([0, 1], 2), [0, 1])
    expectArraysClose(normalizeRange([0, 1], 3), [0, 1])
  })

  // Input validation tests
  it('should throw error for invalid tolerance values', () => {
    expect(() => normalizeRange([0.2, 0.4], 0)).toThrow()
    expect(() => normalizeRange([0.2, 0.4], -1)).toThrow()
    expect(() => normalizeRange([0.2, 0.4], 0.5)).toThrow()
  })

  it('should throw error for out-of-bounds range values', () => {
    expect(() => normalizeRange([-0.1, 0.5], 2)).toThrow()
    expect(() => normalizeRange([0.2, 1.1], 2)).toThrow()
    expect(() => normalizeRange([-1, 2], 2)).toThrow()
  })

  // Large tolerance tests
  it('should handle large tolerance values correctly', () => {
    const [min, max] = normalizeRange([0.4, 0.6], 10)
    expect(min).toBeCloseTo(0, 6)
    expect(max).toBeCloseTo(1, 6)
  })

  // Asymmetric expansion tests
  it('should handle asymmetric expansion when hitting boundaries', () => {
    expectArraysClose(normalizeRange([0.9, 0.95], 4), [0.8, 1])
    expectArraysClose(normalizeRange([0.05, 0.1], 4), [0, 0.2])
  })
})
