import { ColorSpace, Model } from './types'

export const isModel = (model: unknown): model is Model => {
  return (
    typeof model === 'object' &&
    ((model as Partial<Model>).colorSpace === ColorSpace.p3 ||
      (model as Partial<Model>).colorSpace === ColorSpace.srgb) &&
    (model as Partial<Model>).colors instanceof Map &&
    typeof (model as Partial<Model>).interval === 'number' &&
    typeof (model as Partial<Model>).length === 'number' &&
    Array.isArray((model as Partial<Model>).squares) &&
    Array.isArray((model as Partial<Model>).triangle)
  )
}
