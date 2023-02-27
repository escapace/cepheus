import { toPosition } from '@cepheus/utilities'
import { range } from 'lodash-es'
import { Square } from '../types'

export function createSquareOptions(square: Square, interval: number) {
  const position = toPosition(square, interval)

  const [lightness, chroma] = range(2).map((_, index) => {
    const range = [position[index], position[index] + interval] as [
      number,
      number
    ]

    const target = range[1]

    return {
      range,
      target
    }
  })

  return {
    lightness,
    chroma
  }
}
