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
          extended: false,
          lightness: 10,
        },
        input: '---color-red-10-20-30',
      },
      {
        expected: {
          alpha: 1,
          chroma: 25,
          color: 'blue',
          extended: false,
          lightness: 15,
        },
        input: '---color-blue-15-25',
      },
      {
        expected: {
          alpha: 1,
          chroma: undefined,
          color: 'green',
          extended: false,
          lightness: undefined,
        },
        input: '---color-green-100',
      },
      {
        expected: {
          alpha: 1,
          chroma: undefined,
          color: 'name',
          extended: false,
          lightness: undefined,
        },
        input: '---color-name',
      },
      // {
      //   expected: {
      //     alpha: 1,
      //     chroma: 67,
      //     color: '123a',
      //     lightness: 45,
      //   },
      //   input: '---color-123a-45-67',
      // },
      {
        expected: {
          alpha: 0,
          chroma: 0,
          color: 'name',
          extended: false,
          lightness: 0,
        },
        input: '---color-name-0-0-0',
      },
      {
        expected: {
          alpha: 1,
          chroma: 999,
          color: 'name',
          extended: false,
          lightness: 999,
        },
        input: '---color-name-999-999-100',
      },
      {
        expected: {
          alpha: 0.05,
          chroma: undefined,
          color: 'name',
          extended: false,
          lightness: undefined,
        },
        input: '---color-name-05',
      },
      {
        expected: {
          alpha: 1,
          chroma: 67,
          color: 123,
          extended: false,
          lightness: 45,
        },
        input: '---color-123-45-67',
      },
      {
        expected: {
          alpha: 0.5,
          chroma: undefined,
          color: 'abc',
          extended: false,
          lightness: undefined,
        },
        input: '---color-abc-50',
      },
      {
        expected: {
          alpha: 0.5,
          chroma: undefined,
          color: 'abc',
          extended: true,
          lightness: undefined,
        },
        input: '---color-x-abc-50',
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
