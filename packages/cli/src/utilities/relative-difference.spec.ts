import { assert, describe, it } from 'vitest'
import { relativeDifference } from './relative-difference'

describe('./src/utilities/relative-difference.spec.ts', () => {
  describe('identical values', () => {
    it('should return 0 when both values are identical', () => {
      assert.equal(relativeDifference(150, 150, 100, 200), 0)
      assert.equal(relativeDifference(50, 50, 0, 100), 0)
      assert.equal(relativeDifference(0, 0, 0, 100), 0)
    })

    it('should return 0 when all parameters are equal', () => {
      assert.equal(relativeDifference(100, 100, 100, 100), 0)
      assert.equal(relativeDifference(50, 50, 50, 50), 0)
    })
  })

  describe('different values within range', () => {
    it('should calculate relative difference correctly', () => {
      assert.equal(relativeDifference(100, 150, 100, 200), 0.5)
      assert.equal(relativeDifference(150, 100, 100, 200), 0.5)
      assert.equal(relativeDifference(125, 150, 100, 200), 0.25)
      assert.equal(relativeDifference(175, 150, 100, 200), 0.25)
      assert.equal(relativeDifference(150, 175, 100, 200), 0.25)
    })

    it('should handle values at range boundaries', () => {
      assert.equal(relativeDifference(100, 200, 100, 200), 1)
      assert.equal(relativeDifference(200, 100, 100, 200), 1)
    })
  })

  describe('edge cases with zero', () => {
    it('should handle zero values correctly', () => {
      assert.equal(relativeDifference(50, 0, 0, 100), 0.5)
      assert.equal(relativeDifference(0, 50, 0, 100), 0.5)
      assert.equal(relativeDifference(0, 0, 0, 100), 0)
    })

    it('should handle both values being zero', () => {
      assert.equal(relativeDifference(0, 0, -10, 10), 0)
      assert.equal(relativeDifference(0, 0, 0, 1), 0)
    })
  })

  describe('negative values', () => {
    it('should handle negative numbers correctly', () => {
      assert.equal(relativeDifference(-50, -25, -100, 0), 0.25)
      assert.equal(relativeDifference(-25, -50, -100, 0), 0.25)
    })

    it('should handle mixed positive and negative values', () => {
      assert.equal(relativeDifference(-10, 10, -20, 20), 0.5)
      assert.equal(relativeDifference(10, -10, -20, 20), 0.5)
    })
  })

  describe('fractional values', () => {
    it('should handle decimal numbers correctly', () => {
      assert.equal(relativeDifference(1.5, 2.5, 1, 3), 0.5)
      assert.equal(relativeDifference(0.1, 0.2, 0, 1), 0.1)
      assert.equal(relativeDifference(2, 4, 0, 10), 0.2)
    })
  })

  describe('large values', () => {
    it('should handle large numbers correctly', () => {
      assert.equal(relativeDifference(1000, 2000, 1000, 3000), 0.5)
      assert.equal(relativeDifference(5000, 10_000, 0, 20_000), 0.25)
    })
  })
})
