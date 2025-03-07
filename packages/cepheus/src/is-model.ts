import { ColorGamut, type Model } from './types'

export const isModel = (model: unknown): model is Model =>
  typeof model === 'object' &&
  ((model as Partial<Model>).colorGamut === ColorGamut.p3 ||
    (model as Partial<Model>).colorGamut === ColorGamut.srgb) &&
  (model as Partial<Model>).colors instanceof Map &&
  typeof (model as Partial<Model>).interval === 'number' &&
  typeof (model as Partial<Model>).length === 'number' &&
  Array.isArray((model as Partial<Model>).squares) &&
  Array.isArray((model as Partial<Model>).triangle)
