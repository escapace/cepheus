// divisors.test.ts
import { describe, expect, it } from 'vitest'
import { divisors } from './divisors'

describe('findDivisors', () => {
  it('should find divisors of a prime number', () => {
    expect(divisors(7)).toEqual([1])
    expect(divisors(13)).toEqual([1])
    expect(divisors(2)).toEqual([1])
  })

  it('should find divisors of composite numbers', () => {
    expect(divisors(12)).toEqual([1, 2, 3, 4, 6])
    expect(divisors(24)).toEqual([1, 2, 3, 4, 6, 8, 12])
    expect(divisors(18)).toEqual([1, 2, 3, 6, 9])
  })

  it('should find divisors of perfect squares', () => {
    expect(divisors(16)).toEqual([1, 2, 4, 8])
    expect(divisors(25)).toEqual([1, 5])
    expect(divisors(36)).toEqual([1, 2, 3, 4, 6, 9, 12, 18])
  })

  it('should handle edge case of 1', () => {
    expect(divisors(1)).toEqual([])
  })

  it('should handle large numbers', () => {
    expect(divisors(100)).toEqual([1, 2, 4, 5, 10, 20, 25, 50])
    expect(divisors(60)).toEqual([1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30])
  })

  it('should return empty array for invalid input', () => {
    expect(divisors(0)).toEqual([])
    expect(divisors(-5)).toEqual([])
    expect(divisors(3.14)).toEqual([])
    expect(divisors(NaN)).toEqual([])
    expect(divisors(Infinity)).toEqual([])
  })

  it('should return results in ascending order', () => {
    const result = divisors(30)
    expect(result).toEqual([1, 2, 3, 5, 6, 10, 15])

    // Verify it's actually sorted
    for (let index = 1; index < result.length; index++) {
      expect(result[index]).toBeGreaterThan(result[index - 1])
    }
  })

  it('should exclude the number itself from divisors', () => {
    const testNumbers = [6, 12, 20, 42, 100]

    testNumbers.forEach((number_) => {
      expect(divisors(number_)).not.toContain(number_)
    })
  })
})
