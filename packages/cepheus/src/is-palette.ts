import type { Palette } from './types'

export const isPalette = (palette: unknown): palette is Palette =>
  typeof palette === 'object' &&
  ((palette as Partial<Palette>).colorGamut === 'p3' ||
    (palette as Partial<Palette>).colorGamut === 'srgb') &&
  (palette as Partial<Palette>).colors instanceof Map &&
  typeof (palette as Partial<Palette>).interval === 'number' &&
  typeof (palette as Partial<Palette>).length === 'number' &&
  Array.isArray((palette as Partial<Palette>).squares) &&
  Array.isArray((palette as Partial<Palette>).triangles)
