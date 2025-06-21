import { once } from 'lodash-es'
import { createMinimumPerimeterTriangle } from '../utilities/create-minimum-perimeter-triangle'
import type { Store } from './create-store'
import { selectorSquares } from './selector-squares'

export const selectorTriangle = once((store: Store, index: boolean | number = false) => {
  const { interval } = store.options

  // eslint-disable-next-line typescript/no-unsafe-argument, typescript/no-explicit-any
  const squares = Array.from(selectorSquares(store, index as any).keys())
  return createMinimumPerimeterTriangle(squares, interval)
})
