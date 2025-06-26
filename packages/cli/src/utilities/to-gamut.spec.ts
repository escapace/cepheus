import { ColorSpace, OKLCH, P3, sRGB, toGamutCSS } from 'colorjs.io/fn'
import assert from 'node:assert'
import { describe, it } from 'vitest'
ColorSpace.register(sRGB)
ColorSpace.register(OKLCH)
ColorSpace.register(P3)

describe('toGamut', () => {
  it('.', () => {
    const { space } = toGamutCSS(
      { alpha: 1, coords: [0.7382, 0.2047, 51], space: OKLCH },
      { space: sRGB },
    )

    assert.equal(space.id, 'srgb')
  })

  it('.', () => {
    const { space } = toGamutCSS(
      { alpha: 1, coords: [0.7029, 0.1233, 51], space: OKLCH },
      { space: P3 },
    )

    assert.equal(space.id, 'p3')
  })
})
