import { INTERPOLATOR } from './constants'
import type { Interpolator, Model } from './types'

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
  const value = interpolator[INTERPOLATOR]

  if (!(a === undefined && b === undefined)) {
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
  const value = interpolator[INTERPOLATOR]

  if (!(a === undefined && b === undefined)) {
    return value.updateLightness(a, b).then(() => value.state.lightness)
  }

  return value.state.lightness
}

export function model(interpolator: Interpolator, model?: undefined): Model
export function model(interpolator: Interpolator, model?: undefined): Model
export function model(interpolator: Interpolator, model: Model): Promise<Model>
export function model(interpolator: Interpolator, model?: Model): Model | Promise<Model> {
  const value = interpolator[INTERPOLATOR]

  if (model !== undefined) {
    return value.updateModel(model).then(() => value.state.model)
  }

  return value.state.model
}
