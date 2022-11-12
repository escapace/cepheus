import { assert } from 'chai'
import { range } from 'lodash-es'
import { cartesianProduct } from './cartesian-product'

describe('./src/cartesian-product.spec.ts', () => {
  it('.', () => {
    assert.deepEqual(cartesianProduct([1, 2], [3, 4], [5, 6]), [
      [1, 3, 5],
      [1, 3, 6],
      [1, 4, 5],
      [1, 4, 6],
      [2, 3, 5],
      [2, 3, 6],
      [2, 4, 5],
      [2, 4, 6]
    ])
  })

  it('cube', () => {
    const levels = 2
    const distribution = range(0, 100, 100 / levels)
    assert.deepEqual(
      cartesianProduct(distribution, distribution, distribution),
      [
        [0, 0, 0],
        [0, 0, 50],
        [0, 50, 0],
        [0, 50, 50],
        [50, 0, 0],
        [50, 0, 50],
        [50, 50, 0],
        [50, 50, 50]
      ]
    )
  })
})
