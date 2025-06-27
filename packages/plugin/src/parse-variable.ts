/* eslint-disable typescript/no-non-null-assertion */
import { parseAlpha } from './parse-alpha'

const REGEX = /^---color(-(x))?-(([a-z]+)|(\d+))(-(\d{1,3})-(\d{1,3}))?(-(\d{1,2}|100))?$/i

const parseNumber = (value: string | undefined) =>
  value === undefined ? undefined : parseInt(value, 10)

export const parseVariable = (
  variable: string,
):
  | {
      alpha: number
      chroma: number | undefined
      color: number | string
      extended: boolean
      lightness: number | undefined
    }
  | undefined => {
  const array = REGEX.exec(variable)

  if (array === null) {
    return undefined
  }

  const flags = (array[2] as string | undefined)?.split('')
  const colorString = array[4] as string | undefined
  const colorNumber = colorString === undefined ? parseNumber(array[5])! : undefined
  const color = (colorString ?? colorNumber)!

  const lightness = parseNumber(array[7] as string | undefined)
  const chroma = lightness === undefined ? undefined : parseNumber(array[8] as string | undefined)
  const alpha = parseAlpha(array[10] as string | undefined)
  const extended = flags?.includes('x') === true

  return { alpha, chroma, color, extended, lightness }
}
