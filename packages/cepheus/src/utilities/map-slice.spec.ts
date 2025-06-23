import { describe, it, expect } from 'vitest'
import { mapSlice } from './map-slice'

describe('mapSlice', () => {
  it('should handle empty array', () => {
    const result = mapSlice(
      [],
      () => 1,
      (slice) => slice.length,
    )

    expect(result).toEqual([])
  })

  it('should handle single element array', () => {
    const result = mapSlice(
      [42],
      () => 1,
      (slice, index) => ({ index, slice }),
    )

    expect(result).toEqual([{ index: 0, slice: [42] }])
  })

  it('should process array with fixed slice length', () => {
    const numbers = [1, 2, 3, 4, 5, 6]

    const result = mapSlice(
      numbers,
      () => 2, // Always take 2 elements
      (slice, index) => ({ index, sum: slice.reduce((a, b) => a + b, 0) }),
    )

    expect(result).toEqual([
      { index: 0, sum: 3 }, // [1, 2]
      { index: 2, sum: 7 }, // [3, 4]
      { index: 4, sum: 11 }, // [5, 6]
    ])
  })

  it('should handle dynamic slice lengths based on current value', () => {
    const words = ['hi', 'hello', 'a', 'world', 'test']

    const result = mapSlice(
      words,
      (currentWord) => (currentWord.length > 3 ? 2 : 1), // Long words take 2, short take 1
      (slice, index) => ({ startIndex: index, text: slice.join(' ') }),
    )

    expect(result).toEqual([
      { startIndex: 0, text: 'hi' },
      { startIndex: 1, text: 'hello a' }, // 'hello' is long, takes 2
      { startIndex: 3, text: 'world test' }, // 'world' is long, takes 2
    ])
  })

  it('should handle slice length based on index position', () => {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8]

    const result = mapSlice(
      numbers,
      (_, index) => (index === 0 ? 3 : 2), // First slice takes 3, others take 2
      (slice) => slice.reduce((a, b) => a + b, 0),
    )

    expect(result).toEqual([
      6, // [1, 2, 3]
      9, // [4, 5]
      13, // [6, 7]
      8, // [8]
    ])
  })

  it('should handle slice length that exceeds remaining array length', () => {
    const numbers = [1, 2, 3]

    const result = mapSlice(
      numbers,
      () => 10, // Request more than available
      (slice, index) => ({ index, slice: [...slice] }),
    )

    expect(result).toEqual([
      { index: 0, slice: [1, 2, 3] }, // Takes all remaining elements
    ])
  })

  it('should ensure minimum slice length of 1', () => {
    const numbers = [1, 2, 3, 4]

    const result = mapSlice(
      numbers,
      () => -5, // Negative slice length should be clamped to 1
      (slice) => slice[0],
    )

    expect(result).toEqual([1, 2, 3, 4])
  })

  it('should handle zero slice length by clamping to 1', () => {
    const numbers = [1, 2, 3]

    const result = mapSlice(
      numbers,
      () => 0, // Zero slice length should be clamped to 1
      (slice) => slice.length,
    )

    expect(result).toEqual([1, 1, 1])
  })

  it('should process text with sentence-like slicing', () => {
    const words = ['Hello', 'world!', 'How', 'are', 'you?', 'Fine.']

    const result = mapSlice(
      words,
      (_, index) => {
        // Take words until punctuation or max 3 words
        let count = 1
        for (let index_ = index; index_ < Math.min(index + 3, words.length); index_++) {
          if (
            words[index_].includes('!') ||
            words[index_].includes('?') ||
            words[index_].includes('.')
          ) {
            return index_ - index + 1
          }
          if (index_ > index) count++
        }
        return count
      },
      (slice) => slice.join(' '),
    )

    expect(result).toEqual([
      'Hello world!', // Stops at punctuation
      'How are you?', // Stops at punctuation
      'Fine.', // Single word with punctuation
    ])
  })

  it('should pass correct start indices to processor', () => {
    const numbers = [1, 2, 3, 4, 5]
    const indices: number[] = []

    mapSlice(
      numbers,
      () => 2,
      (slice, startIndex) => {
        indices.push(startIndex)
        return slice.length
      },
    )

    expect(indices).toEqual([0, 2, 4])
  })

  it('should handle complex objects', () => {
    interface Item {
      category: string
      id: number
      value: number
    }

    const items: Item[] = [
      { category: 'A', id: 1, value: 10 },
      { category: 'A', id: 2, value: 20 },
      { category: 'B', id: 3, value: 30 },
      { category: 'B', id: 4, value: 40 },
      { category: 'C', id: 5, value: 50 },
    ]

    const result = mapSlice(
      items,
      (currentItem, index) => {
        // Group items of same category
        let count = 1
        for (let index_ = index + 1; index_ < items.length; index_++) {
          if (items[index_].category === currentItem.category) {
            count++
          } else {
            break
          }
        }
        return count
      },
      (slice) => ({
        category: slice[0].category,
        itemCount: slice.length,
        totalValue: slice.reduce((sum, item) => sum + item.value, 0),
      }),
    )

    expect(result).toEqual([
      { category: 'A', itemCount: 2, totalValue: 30 },
      { category: 'B', itemCount: 2, totalValue: 70 },
      { category: 'C', itemCount: 1, totalValue: 50 },
    ])
  })
})
