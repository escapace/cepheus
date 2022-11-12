import { pullAll } from 'lodash-es'
import { neighbours } from './neighbours'

export const isolate = (
  squares: number[],
  interval: number,
  intercardinal: boolean
) => {
  const remaining = [...squares]

  const walk = (square: number): number[] => {
    const seen: number[] = []

    const next = (square: number) => {
      if (squares.includes(square) && !seen.includes(square)) {
        seen.push(square)

        neighbours(square, interval, intercardinal).forEach((square) =>
          next(square)
        )
      }
    }

    next(square)

    return seen
  }

  const groups: number[][] = []

  while (remaining.length !== 0) {
    const values = walk(remaining[0])

    pullAll(remaining, values)

    groups.push(values)
  }

  return groups.sort((a, b) => b.length - a.length)
}
