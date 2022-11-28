import { assert } from 'chai'
import { objectHash } from './object-hash'

describe('./src/utilities/object-sort.spec.ts', () => {
  it('.', () => {
    assert.equal(
      objectHash({ f: {}, a: 'b', c: ['e', 'd'] }),
      'ab97c563b78c63262b6adcdbfbd3343b7f5a948d62352543365f9da8999381316311971c07e61e15e9f310b3b95dc78322e180d6ae1d3996b7d005df4840ce29'
    )
  })
})
