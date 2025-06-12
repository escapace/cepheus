import type { Palette, State, Triangle } from './types'
import { chroma0, chroma1, getX0, lightness0, lightness1 } from './utilities/calculations'

export const adjustPalette = (palette: Palette, options: Partial<State> = {}): Palette => {
  if (options?.lightness !== undefined || options?.chroma !== undefined) {
    const state = {
      chroma: options.chroma ?? { max: 1, min: 0 },
      lightness: options.lightness ?? { max: 1, min: 0 },
    }

    const x0 = getX0(palette.triangle)

    const { p0, p1 } = chroma0(x0, palette.triangle, state)

    const triangle: Triangle = [
      lightness0(p0, p1, state),
      chroma1(x0, palette.triangle[1], state),
      lightness1(p0, p1, state),
    ]

    return {
      ...palette,
      triangle,
    }
  }

  return palette
}
