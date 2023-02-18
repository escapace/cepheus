import { assert } from 'chai'
import { parseAlpha } from './parse-alpha'

describe('src/parse-alpha.spec.ts', () => {
  it('.', () => {
    assert.equal(parseAlpha(undefined), 1)
    assert.equal(parseAlpha('1'), 1)
    assert.equal(parseAlpha('9'), 1)
    assert.equal(parseAlpha('0'), 0)
    assert.equal(parseAlpha('011'), 0.11)
    assert.equal(parseAlpha('099'), 0.99)
  })
})
