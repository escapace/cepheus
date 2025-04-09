/* eslint-disable typescript/no-non-null-assertion */
import { parseAlpha } from './parse-alpha'

const REGEX = /^---color-(([a-z]+)|(\d+))(-(\d{1,3})-(\d{1,3}))?(-(\d{1,2}|100))?$/i

const parseNumber = (value: string | undefined) =>
  value === undefined ? undefined : parseInt(value, 10)

export const parseVariable = (
  variable: string,
):
  | {
      alpha: number
      chroma: number | undefined
      color: number | string
      lightness: number | undefined
    }
  | undefined => {
  const array = REGEX.exec(variable)

  if (array === null) {
    return undefined
  }

  const colorString = array[2] as string | undefined
  const colorNumber = colorString === undefined ? parseNumber(array[3])! : undefined
  const color = (colorString ?? colorNumber)!

  const lightness = parseNumber(array[5] as string | undefined)
  const chroma = lightness === undefined ? undefined : parseNumber(array[6] as string | undefined)
  const alpha = parseAlpha(array[8] as string | undefined)

  return { alpha, chroma, color, lightness }
}
