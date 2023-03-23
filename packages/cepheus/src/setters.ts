import { INTERPOLATOR } from './constants'
import { Interpolator, Model } from './types'

export function chroma(interpolator: Interpolator): [low: number, high: number]
export function chroma(
  interpolator: Interpolator,
  a: undefined,
  b: undefined
): [low: number, high: number]
export function chroma(
  interpolator: Interpolator,
  a?: number,
  b?: number
): Promise<[low: number, high: number]>
export function chroma(
  interpolator: Interpolator,
  a?: number,
  b?: number
): [low: number, high: number] | Promise<[low: number, high: number]> {
  const value = interpolator[INTERPOLATOR]

  if (!(a === undefined && b === undefined)) {
    return value.updateChroma(a, b).then(() => value.state.chroma)
  }

  return value.state.chroma
}

export function lightness(
  interpolator: Interpolator
): [low: number, high: number]
export function lightness(
  interpolator: Interpolator,
  a: undefined,
  b: undefined
): [low: number, high: number]
export function lightness(
  interpolator: Interpolator,
  a?: number,
  b?: number
): Promise<[low: number, high: number]>
export function lightness(
  interpolator: Interpolator,
  a?: number,
  b?: number
): [low: number, high: number] | Promise<[low: number, high: number]> {
  const value = interpolator[INTERPOLATOR]

  if (!(a === undefined && b === undefined)) {
    return value.updateLightness(a, b).then(() => value.state.lightness)
  }

  return value.state.lightness
}

export function darkMode(
  interpolator: Interpolator,
  darkMode?: undefined
): boolean
export function darkMode(
  interpolator: Interpolator,
  darkMode?: undefined
): boolean
export function darkMode(
  interpolator: Interpolator,
  darkMode: boolean
): Promise<boolean>
export function darkMode(
  interpolator: Interpolator,
  darkMode?: boolean
): Promise<boolean> | boolean {
  const value = interpolator[INTERPOLATOR]

  if (darkMode !== undefined) {
    return value.updateDarkMode(darkMode).then(() => value.state.darkMode)
  }

  return value.state.darkMode
}

export function model(interpolator: Interpolator, model?: undefined): Model
export function model(interpolator: Interpolator, model?: undefined): Model
export function model(interpolator: Interpolator, model: Model): Promise<Model>
export function model(
  interpolator: Interpolator,
  model?: Model
): Promise<Model> | Model {
  const value = interpolator[INTERPOLATOR]

  if (model !== undefined) {
    return value.updateModel(model).then(() => value.state.model)
  }

  return value.state.model
}
