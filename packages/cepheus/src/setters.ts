import { CEPHEUS_INTERPOLATOR } from './constants'
import type { Interpolator, Palette } from './types'

export function chroma(interpolator: Interpolator): { max: number; min: number }
export function chroma(
  interpolator: Interpolator,
  a: undefined,
  b: undefined,
): { max: number; min: number }
export function chroma(
  interpolator: Interpolator,
  a?: number,
  b?: number,
): Promise<{ max: number; min: number }>
export function chroma(
  interpolator: Interpolator,
  a?: number,
  b?: number,
): Promise<{ max: number; min: number }> | { max: number; min: number } {
  const value = interpolator[CEPHEUS_INTERPOLATOR]

  if (a !== undefined || b !== undefined) {
    return value.updateChroma(a, b).then(() => value.state.chroma)
  }

  return value.state.chroma
}

export function lightness(interpolator: Interpolator): { max: number; min: number }
export function lightness(
  interpolator: Interpolator,
  a: undefined,
  b: undefined,
): { max: number; min: number }
export function lightness(
  interpolator: Interpolator,
  a?: number,
  b?: number,
): Promise<{ max: number; min: number }>
export function lightness(
  interpolator: Interpolator,
  a?: number,
  b?: number,
): Promise<{ max: number; min: number }> | { max: number; min: number } {
  const value = interpolator[CEPHEUS_INTERPOLATOR]

  if (a !== undefined || b !== undefined) {
    return value.updateLightness(a, b).then(() => value.state.lightness)
  }

  return value.state.lightness
}

export function palette(interpolator: Interpolator, palette?: undefined): Palette
export function palette(interpolator: Interpolator, palette?: undefined): Palette
export function palette(interpolator: Interpolator, palette: Palette): Promise<Palette>
export function palette(interpolator: Interpolator, palette?: Palette): Palette | Promise<Palette> {
  const value = interpolator[CEPHEUS_INTERPOLATOR]

  if (palette !== undefined) {
    return value.updatePalette(palette).then(() => value.state.palette)
  }

  return value.state.palette
}
