import { describe, expect, it } from 'vitest'
import { parseVariable } from './parse-variable'

describe('parseVariable', () => {
  describe('valid variables', () => {
    it.each([
      {
        expected: {
          alpha: 0.3,
          chroma: 20,
          color: 'red',
          lightness: 10,
          type: 'color',
        },
        input: '---color-red-10-20-30',
      },
      {
        expected: {
          alpha: 1,
          chroma: 25,
          color: 'blue',
          lightness: 15,
          type: 'invert',
        },
        input: '---invert-blue-15-25',
      },
      {
        expected: {
          alpha: 1,
          chroma: undefined,
          color: 'green',
          lightness: undefined,
          type: 'color',
        },
        input: '---color-green-100',
      },
      {
        expected: {
          alpha: 1,
          chroma: undefined,
          color: 'name',
          lightness: undefined,
          type: 'color',
        },
        input: '---color-name',
      },
      // {
      //   expected: {
      //     alpha: 1,
      //     chroma: 67,
      //     color: '123a',
      //     lightness: 45,
      //     type: 'color',
      //   },
      //   input: '---color-123a-45-67',
      // },
      {
        expected: {
          alpha: 0,
          chroma: 0,
          color: 'name',
          lightness: 0,
          type: 'color',
        },
        input: '---color-name-0-0-0',
      },
      {
        expected: {
          alpha: 1,
          chroma: 999,
          color: 'name',
          lightness: 999,
          type: 'color',
        },
        input: '---color-name-999-999-100',
      },
      {
        expected: {
          alpha: 0.05,
          chroma: undefined,
          color: 'name',
          lightness: undefined,
          type: 'color',
        },
        input: '---color-name-05',
      },
      {
        expected: {
          alpha: 1,
          chroma: 67,
          color: 123,
          lightness: 45,
          type: 'invert',
        },
        input: '---invert-123-45-67',
      },
      {
        expected: {
          alpha: 0.5,
          chroma: undefined,
          color: 'abc',
          lightness: undefined,
          type: 'invert',
        },
        input: '---invert-abc-50',
      },
    ])('parses "$input" correctly', ({ expected, input }) => {
      expect(parseVariable(input)).toEqual(expected)
    })
  })

  describe('invalid variables', () => {
    it.each([
      { input: '---color' },
      { input: '---invalid-red-10' },
      { input: '---color-red-10-20-30-40' },
      { input: '---color-red--10' },
      { input: 'red' },
      { input: '---color-name-10-' },
      { input: '---color-name-10-20-' },
    ])('returns undefined for "$input"', ({ input }) => {
      expect(parseVariable(input)).toBeUndefined()
    })
  })
})
