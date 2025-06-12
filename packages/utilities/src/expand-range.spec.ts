import { describe, expect, it } from 'vitest'
import { expandRange } from './expand-range'

describe('expandRange', () => {
  describe('Normal cases - mean preservation', () => {
    it('should expand range symmetrically when no boundary constraints', () => {
      const result = expandRange([0.4, 0.6], 0.1)
      expect(result[0]).toBeCloseTo(0.35)
      expect(result[1]).toBeCloseTo(0.65)

      // Verify width increased by expansion
      const originalWidth = 0.6 - 0.4
      const newWidth = result[1] - result[0]
      expect(newWidth).toBeCloseTo(originalWidth + 0.1)

      // Verify mean is preserved
      const originalMean = (0.4 + 0.6) / 2
      const newMean = (result[0] + result[1]) / 2
      expect(newMean).toBeCloseTo(originalMean)
    })

    it('should handle zero expansion', () => {
      const result = expandRange([0.3, 0.7], 0)
      expect(result[0]).toBeCloseTo(0.3)
      expect(result[1]).toBeCloseTo(0.7)
    })

    it('should expand point ranges', () => {
      const result = expandRange([0.5, 0.5], 0.2)
      expect(result).toEqual([0.4, 0.6])
    })
  })

  describe('Lower boundary constraints', () => {
    it('should shift right when expansion would go below 0', () => {
      const result = expandRange([0.05, 0.1], 0.15)
      expect(result[0]).toBeCloseTo(0)
      expect(result[1]).toBeCloseTo(0.2)

      // Verify width is correct
      const newWidth = result[1] - result[0]
      expect(newWidth).toBeCloseTo(0.05 + 0.15) // original + expansion
    })

    it('should handle range starting at 0', () => {
      const result = expandRange([0, 0.2], 0.1)
      expect(result[0]).toBeCloseTo(0)
      expect(result[1]).toBeCloseTo(0.3)
    })
  })

  describe('Upper boundary constraints', () => {
    it('should shift left when expansion would go above 1', () => {
      const result = expandRange([0.9, 1], 0.1)
      expect(result).toEqual([0.8, 1])

      // Verify width is correct
      const newWidth = result[1] - result[0]
      expect(newWidth).toBeCloseTo(0.1 + 0.1) // original + expansion
    })

    it('should handle range ending at 1', () => {
      const result = expandRange([0.8, 1], 0.1)
      expect(result[0]).toBeCloseTo(0.7)
      expect(result[1]).toBeCloseTo(1)
    })
  })

  describe('Input validation', () => {
    it('should throw error for range values below 0', () => {
      expect(() => expandRange([-0.1, 0.5], 0.1)).toThrow(
        'Range must be within [0, 1] with first value ≤ second value',
      )
      expect(() => expandRange([0.2, -0.1], 0.1)).toThrow(
        'Range must be within [0, 1] with first value ≤ second value',
      )
    })

    it('should throw error for range values above 1', () => {
      expect(() => expandRange([0.5, 1.5], 0.1)).toThrow(
        'Range must be within [0, 1] with first value ≤ second value',
      )
      expect(() => expandRange([1.2, 1.5], 0.1)).toThrow(
        'Range must be within [0, 1] with first value ≤ second value',
      )
    })

    it('should throw error when first value > second value', () => {
      expect(() => expandRange([0.7, 0.3], 0.1)).toThrow(
        'Range must be within [0, 1] with first value ≤ second value',
      )
    })

    it('should accept boundary values', () => {
      expect(() => expandRange([0, 1], 0)).not.toThrow()
      expect(() => expandRange([0, 0], 0.5)).not.toThrow()
      expect(() => expandRange([1, 1], 0)).not.toThrow()
    })
  })

  describe('Edge cases', () => {
    it('should clamp expansion when it would exceed unit interval', () => {
      const result = expandRange([0.4, 0.6], 0.9)
      expect(result[0]).toBeCloseTo(0)
      expect(result[1]).toBeCloseTo(1)
      expect(result[1] - result[0]).toBeCloseTo(1) // clamped to maximum width
    })

    it('should handle full range input with zero expansion', () => {
      const result = expandRange([0, 1], 0)
      expect(result[0]).toBeCloseTo(0)
      expect(result[1]).toBeCloseTo(1)
    })

    it('should handle maximum possible expansion', () => {
      const result = expandRange([0.4, 0.5], 0.4)
      expect(result[0]).toBeCloseTo(0.2)
      expect(result[1]).toBeCloseTo(0.7)
    })

    it('should handle very small ranges', () => {
      const result = expandRange([0.499, 0.501], 0.1)
      expect(result[0]).toBeCloseTo(0.449)
      expect(result[1]).toBeCloseTo(0.551)
    })

    it('should clamp expansion values above 1', () => {
      const result = expandRange([0.4, 0.5], 1.5) // expansion gets clamped to 1
      expect(result[0]).toBeCloseTo(0)
      expect(result[1]).toBeCloseTo(1)
      expect(result[1] - result[0]).toBeCloseTo(1) // clamped to maximum width
    })

    it('should clamp negative expansion values to 0', () => {
      const result = expandRange([0.4, 0.6], -0.5) // expansion gets clamped to 0
      expect(result[0]).toBeCloseTo(0.4)
      expect(result[1]).toBeCloseTo(0.6)
    })
  })

  describe('Boundary validation', () => {
    it('should always return values within [0, 1]', () => {
      const testCases: Array<[[number, number], number]> = [
        [[0.1, 0.2], 0.5],
        [[0.8, 0.9], 0.3],
        [[0, 0.1], 0.8],
        [[0.9, 1], 0.5],
      ]

      testCases.forEach(([range, expansion]) => {
        const result = expandRange(range, expansion)
        expect(result[0]).toBeGreaterThanOrEqual(0)
        expect(result[1]).toBeLessThanOrEqual(1)
        expect(result[0]).toBeLessThanOrEqual(result[1])
      })
    })

    it('should always increase width by expansion amount (when possible)', () => {
      const testCases: Array<[[number, number], number]> = [
        [[0.3, 0.5], 0.1],
        [[0.1, 0.3], 0.2],
        [[0.6, 0.8], 0.15],
      ]

      testCases.forEach(([range, expansion]) => {
        const result = expandRange(range, expansion)
        const originalWidth = range[1] - range[0]
        const newWidth = result[1] - result[0]

        if (originalWidth + expansion <= 1) {
          expect(newWidth).toBeCloseTo(originalWidth + expansion)
        }
      })
    })
  })

  describe('Mathematical properties', () => {
    it('should preserve mean when no boundary constraints exist', () => {
      const testCases: Array<[[number, number], number]> = [
        [[0.3, 0.7], 0.1],
        [[0.25, 0.75], 0.2],
        [[0.4, 0.6], 0.05],
      ]

      testCases.forEach(([range, expansion]) => {
        const result = expandRange(range, expansion)
        const originalMean = (range[0] + range[1]) / 2
        const newMean = (result[0] + result[1]) / 2

        // Check if boundary constraints were applied
        const idealLower = originalMean - (range[1] - range[0] + expansion) / 2
        const idealUpper = originalMean + (range[1] - range[0] + expansion) / 2

        if (idealLower >= 0 && idealUpper <= 1) {
          expect(newMean).toBeCloseTo(originalMean)
        }
      })
    })
  })
})
