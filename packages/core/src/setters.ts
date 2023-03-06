import { INTERPOLATOR } from './constants'
import { Interpolator } from './types'

export function chroma(
  interpolator: Interpolator,
  a?: number,
  b?: number
): [low: number, high: number] {
  const value = interpolator[INTERPOLATOR]

  if (arguments.length > 1) {
    value.updateChroma(a, b)
  }

  return value.state.chroma
}

export function lightness(
  interpolator: Interpolator,
  a?: number,
  b?: number
): [low: number, high: number] {
  const value = interpolator[INTERPOLATOR]

  if (arguments.length > 1) {
    value.updateLightness(a, b)
  }

  return value.state.lightness
}

export function darkMode(
  interpolator: Interpolator,
  darkMode?: boolean
): boolean {
  const value = interpolator[INTERPOLATOR]

  if (darkMode !== undefined) {
    value.updateDarkMode(darkMode)
  }

  return value.state.darkMode
}
