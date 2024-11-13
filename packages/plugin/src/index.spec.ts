import { assert, describe, it } from 'vitest'
import { createCepheusPlugin } from './index'

describe('src/index.spec.ts', () => {
  it('.', () => {
    assert.isFunction(createCepheusPlugin)
  })
})
