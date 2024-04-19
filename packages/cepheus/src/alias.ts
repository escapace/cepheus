import type { Model } from './types'

export const alias = (model: Model, alias?: Model['alias']): Model => ({
  ...model,
  alias
})
