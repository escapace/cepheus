import type { Triangle } from 'cepheus'
import { once } from 'lodash-es'
import type { Store } from './create-store'
import { selectorTriangle } from './selector-triangle'

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
