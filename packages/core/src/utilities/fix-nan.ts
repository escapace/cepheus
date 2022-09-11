import { Color } from '@escapace/bruni-color'

export const fixNaN = (color: Color): Color => {
  if (color.space.id === 'oklch') {
    return {
      space: color.space,
      alpha: color.alpha,
      coords: color.coords.map((value) => {
        if (isNaN(value)) {
          /* console.warn(`NaN for [${r}, ${g}, ${b}]`) */

          return 0
        }

        return value
      }) as [number, number, number]
    }
  }

  return color
}
