import { assert } from 'chai'
import { intersection } from './intersection'

describe('./src/intersection.spec.ts', () => {
  it('.', () => {
    assert.deepEqual(
      intersection(
        [
          [4, -2.5],
          [-1.5, 2.5]
        ],
        [
          [-2, -5],
          [2.5, 4]
        ]
      ),
      [0.734_375, 0.468_75]
    )

    assert.deepEqual(
      intersection(
        [
          [2, -2.5],
          [-1.75, 2.25]
        ],
        [
          [-1.75, 2.25],
          [2, -2.5]
        ]
      ),
      undefined
    )
  })
})
