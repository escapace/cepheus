import { assert, describe, it } from 'vitest'
import { parseAlpha } from './parse-alpha'

describe('src/parse-alpha.spec.ts', () => {
  it('.', () => {
    assert.equal(parseAlpha(undefined), 1)
    assert.equal(parseAlpha('0'), 0)
    assert.equal(parseAlpha('100'), 1)
    assert.equal(parseAlpha('99'), 0.99)
    assert.equal(parseAlpha('1'), 0.01)
    assert.equal(parseAlpha('33'), 0.33)
  })
})
