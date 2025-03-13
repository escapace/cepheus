/* eslint-disable typescript/no-non-null-assertion */
import { DisplayP3Gamut, gamutMapOKLCH, OKLCH, sRGBGamut } from '@texel/color'
import { color as _color, INTERPOLATOR } from 'cepheus'
import { parseVariable } from './parse-variable'
import type { ColorOptions } from './types'

export const color = (
  variable: string,
  options: ColorOptions,
): [number, number, number, number] | undefined => {
  const properties = parseVariable(variable)

  if (properties === undefined) {
    return undefined
  }

  const { alpha, chroma, color, lightness, type } = properties

  const value =
    typeof color === 'string'
      ? (options.colors?.[color] ??
        (lightness === undefined || chroma === undefined ? undefined : _color))
      : lightness === undefined || chroma === undefined
        ? undefined
        : _color

  if (value === undefined) {
    return undefined
  }

  const coords: number[] | undefined = Array.isArray(value)
    ? [...value]
    : value(
        options.interpolator,
        color as string,
        chroma!,
        lightness!,
        (type !== 'invert') !== (options.colorScheme !== 'dark'),
      )

  if (coords === undefined) {
    return undefined
  }

  if (
    options.colorGamutMapping ??
    options.colorGamut !== options.interpolator[INTERPOLATOR].state.model.colorGamut
  ) {
    gamutMapOKLCH(coords, options.colorGamut === 'p3' ? DisplayP3Gamut : sRGBGamut, OKLCH, coords)
  }

  coords[3] = alpha

  return coords as [number, number, number, number]
}
