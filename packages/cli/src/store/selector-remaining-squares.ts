import { tile } from '@cepheus/utilities'
import { isSquareInsideTriangle } from '../utilities/is-square-inside-triangle'
import { createSquareOptions } from './create-square-options'
import type { Store } from './create-store'
import { selectorSquares } from './selector-squares'
import { selectorTriangles } from './selector-triangles'

export const selectorRemainingSquares = (store: Store) => {
  const { interval } = store.options
  const [primaryTriangle, ...triangles] = selectorTriangles(store)
  const squares = selectorSquares(store, true)

  const createEntry = (square: number, colors?: number[]) => {
    if (colors !== undefined && colors.length === 0) {
      return undefined
    }

    if (squares.has(square)) {
      // eslint-disable-next-line typescript/no-non-null-assertion
      const { state } = squares.get(square)!
      const indexes = colors ?? store.options.colors.map((_, index) => index)

      if (
        indexes.every((index) => {
          const value = state.colors[index]
          return value !== null && value !== undefined
        })
      ) {
        return undefined
      }
    }

    return [square, createSquareOptions(square, interval, colors)] as const
  }

  return new Map(
    tile(interval)
      .map((square) => {
        if (isSquareInsideTriangle(square, interval, primaryTriangle)) {
          return createEntry(square)
        }

        const colors = triangles
          .filter((triangle) => isSquareInsideTriangle(square, interval, triangle))
          .map((triangle) => triangles.indexOf(triangle))
          .filter((value) => value !== -1)

        return createEntry(square, colors)
      })
      .filter((value) => value !== undefined),
  )
}
