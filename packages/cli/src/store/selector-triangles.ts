import type { Triangle } from 'cepheus'
import { once } from 'lodash-es'
import type { Store } from './create-store'
import { createMinimumPerimeterTriangle } from '../utilities/create-minimum-perimeter-triangle'
import { selectorSquares } from './selector-squares'

const selectorTriangle = (store: Store, index: boolean | number = false) => {
  const { interval } = store.options

  // eslint-disable-next-line typescript/no-unsafe-argument, typescript/no-explicit-any
  const squares = Array.from(selectorSquares(store, index as any).keys())
  return createMinimumPerimeterTriangle(squares, interval)
}

export const selectorTriangles = once((store: Store): Triangle[] => {
  const primary = selectorTriangle(store, false)
  const triangles: Triangle[] = [primary]

  const { length } = store.options.colors

  for (let index = 0; index < length; index++) {
    const triangle = selectorTriangle(store, index)
    triangles.push(triangle)
  }

  return triangles
})
