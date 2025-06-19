import { once } from 'lodash-es'
import { createMinimumPerimeterTriangle } from '../utilities/create-minimum-perimeter-triangle'
import type { Store } from './create-store'
import { selectorSquares } from './selector-squares'

export const selectorTriangle = once((store: Store) => {
  const { interval } = store.options
  const squares = Array.from(selectorSquares(store).keys())
  return createMinimumPerimeterTriangle(squares, interval)
})
