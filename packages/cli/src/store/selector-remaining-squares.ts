import { tile } from '@cepheus/utilities'
import { isSquareInsideTriangle } from '../utilities/is-square-inside-triangle'
import { createSquareOptions } from './create-square-options'
import type { Store } from './create-store'
import { selectorSquares } from './selector-squares'
import { selectorTriangle } from './selector-triangle'

export const selectorRemainingSquares = (store: Store) => {
  const { interval } = store.options
  const triangle = selectorTriangle(store)
  const squares = Array.from(selectorSquares(store).keys())

  return new Map(
    tile(interval)
      .filter((square) => {
        if (squares.includes(square)) {
          return false
        }

        return isSquareInsideTriangle(square, interval, triangle)
      })
      .map((square) => [square, createSquareOptions(square, interval)] as const),
  )
}
