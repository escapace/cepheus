import { Model } from './types'

export const alias = (model: Model, alias?: Model['alias']) => ({
  ...model,
  alias
})
