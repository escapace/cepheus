import { assert, describe, it, vi } from 'vitest'

import { alias, createInterpolator, INTERPOLATOR, parsePalette } from 'cepheus'
import { color } from '../src/color'
import type { ColorOptions } from './types'

const palette = parsePalette((await import('../perf/palette.json')).default)

const mock = (input: string, options: Omit<ColorOptions, 'colors' | 'interpolator'>) => {
  const spy = vi.fn()

  const value = color(input, {
    ...options,
    colors: {
      red: (interpolator, color, lightness, chroma, isDark) => {
        assert(typeof interpolator[INTERPOLATOR] === 'object')

        spy(...[color, lightness, chroma, isDark])

        return [0, 0, 0] as const
      },
    },
    interpolator: createInterpolator({
      palette: alias(palette, (value) => {
        spy(value)

        return 0
      }),
    }),
  })

  return [value, spy] as const
}

describe('color()', () => {
  it('.', () => {
    const [value, spy] = mock(`---color-red-50-100-50`, { colorGamut: 'p3', colorScheme: 'light' })

    assert.deepEqual(value, [0, 0, 0, 0.5])
    assert.equal(spy.mock.calls.length, 1)

    const [color, lightness, chroma, isDark] = spy.mock.calls[0] as unknown[]

    assert.equal(color, 'red')
    assert.equal(lightness, 50)
    assert.equal(chroma, 100)
    assert(isDark === false)
  })

  it('.', () => {
    const [value, spy] = mock(`---color-red-50`, { colorGamut: 'p3', colorScheme: 'light' })

    assert.deepEqual(value, [0, 0, 0, 0.5])
    assert.equal(spy.mock.calls.length, 1)

    const [color, lightness, chroma, isDark] = spy.mock.calls[0] as unknown[]

    assert.equal(color, 'red')
    assert.equal(lightness, undefined)
    assert.equal(chroma, undefined)
    assert(isDark === false)
  })

  it('.', () => {
    const [value, spy] = mock(`---color-red`, { colorGamut: 'srgb', colorScheme: 'dark' })

    assert.deepEqual(value, [0, 0, 0, 1])
    assert.equal(spy.mock.calls.length, 1)

    const [color, lightness, chroma, isDark] = spy.mock.calls[0] as unknown[]

    assert.equal(color, 'red')
    assert.equal(lightness, undefined)
    assert.equal(chroma, undefined)
    assert(isDark === true)
  })

  it('.', () => {
    const [value, spy] = mock(`---color-primary`, { colorGamut: 'srgb', colorScheme: 'dark' })

    assert(value === undefined)
    assert(spy.mock.calls.length === 0)
  })

  it('.', () => {
    const [value, spy] = mock(`---color-0-100`, { colorGamut: 'srgb', colorScheme: 'dark' })

    assert(value === undefined)
    assert(spy.mock.calls.length === 0)
  })

  it('.', () => {
    const [value, spy] = mock(``, { colorGamut: 'srgb', colorScheme: 'dark' })

    assert(value === undefined)
    assert(spy.mock.calls.length === 0)
  })

  it('.', () => {
    const [value, spy] = mock(`---color-primary-100-100`, {
      colorGamut: 'srgb',
      colorScheme: 'dark',
    })

    assert.notEqual(value, undefined)
    assert.equal(spy.mock.calls.length, 1)
    assert.equal(spy.mock.calls[0].length, 1)
    const [color] = spy.mock.calls[0] as unknown[]

    assert.equal(color, 'primary')
  })

  it('.', () => {
    const [value, spy] = mock(`---color-0-100-100`, {
      colorGamut: 'srgb',
      colorScheme: 'dark',
    })

    assert.notEqual(value, undefined)
    assert.equal(spy.mock.calls.length, 1)
    assert.equal(spy.mock.calls[0].length, 1)
    const [color] = spy.mock.calls[0] as unknown[]

    assert.equal(color, 0)
  })
})
