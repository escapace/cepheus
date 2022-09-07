import { assert } from 'chai'
import { relativeDifference } from './relative-difference'

describe('./src/utilities/relative-difference.ts', () => {
  it('.', () => {
    assert.equal(relativeDifference(150, 150, 100, 200), 0)
    assert.equal(relativeDifference(100, 150, 100, 200), 0.5)
    assert.equal(relativeDifference(200, 150, 100, 200), 0.5)
    assert.equal(relativeDifference(175, 150, 100, 200), 0.25)
    assert.equal(relativeDifference(125, 150, 100, 200), 0.25)
  })
})
