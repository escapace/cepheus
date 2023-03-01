import { toPosition } from '@cepheus/utilities'
import { range } from 'lodash-es'
import { N } from '../constants'
import { OptimizeTaskOptions, Square } from '../types'

export function createSquareOptions(
  square: Square,
  interval: number
): Required<Pick<OptimizeTaskOptions, 'lightness' | 'chroma'>> {
  const position = toPosition(square, interval)

  const [lightness, chroma] = range(2).map((_, index) => {
    const range = [
      position[index] - N / 2,
      position[index] - N / 2 + interval
    ] as [number, number]

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
