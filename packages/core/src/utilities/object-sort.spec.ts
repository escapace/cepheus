import { assert } from 'chai'
import { objectSort } from './object-sort'

describe('./src/utilities/object-sort.spec.ts', () => {
  it('.', () => {
    /* console.log() */
    assert.equal(
      JSON.stringify(objectSort({ f: {}, a: 'b', c: ['e', 'd'] })),
      '{"a":"b","c":["e","d"],"f":{}}'
    )
  })
})
