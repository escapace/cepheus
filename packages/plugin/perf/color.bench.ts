import { createInterpolator, parsePalette } from 'cepheus'
import { assert, bench } from 'vitest'
import { color } from '../src/color'

function randomInt(max: number) {
  return Math.floor(Math.random() * max)
}

const palette = parsePalette((await import('./palette.json')).default)

bench('color p3', () => {
  const value = color(`---color-${randomInt(3)}-${randomInt(255)}-${randomInt(100)}`, {
    colorGamut: 'p3',
    colorScheme: 'light',
    interpolator: createInterpolator({ palette }),
  })

  assert(value !== undefined)
  assert(value.length === 4)
  assert(value.every((value) => typeof value === 'number'))
})

bench('color srgb', () => {
  const value = color(`---color-${randomInt(3)}-${randomInt(255)}-${randomInt(100)}`, {
    colorGamut: 'srgb',
    colorScheme: 'light',
    interpolator: createInterpolator({ palette }),
  })

  assert(value !== undefined)
  assert(value.length === 4)
  assert(value.every((value) => typeof value === 'number'))
})
