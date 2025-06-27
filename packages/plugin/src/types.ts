import type { Interpolator } from 'cepheus'

export interface Combination {
  colorFormat: 'oklch' | 'p3' | 'srgb'
  colorGamut: 'p3' | 'srgb'
  colorScheme: 'dark' | 'light'
}

export interface Options {
  colorFormat?: Array<Combination['colorFormat']>
  colorGamut?: Array<Combination['colorGamut']>
  colorScheme?: Combination['colorScheme']
  colorSchemeStrategy?: 'class' | 'media'
}

export interface IteratorOptions extends Pick<Required<Options>, 'colorSchemeStrategy'> {
  combinations: Combination[]
}

export type ColorFunction = (
  interpolator: Interpolator,
  color: string,
  lightness: number | undefined,
  chroma: number | undefined,
  invert: boolean,
  extended: boolean,
) => [number, number, number] | undefined

export interface CreateIteratorOptions extends Combination {
  colorSchemeStrategy: 'class' | 'media'
  interpolator: Interpolator
  colors?: Record<string, ColorFunction | [number, number, number] | undefined>
}

export interface ColorOptions
  extends Omit<CreateIteratorOptions, 'colorFormat' | 'colorSchemeStrategy'> {
  colorGamutMapping?: boolean
  invert?: boolean
}

// type CreateIterator = (options: CreateIteratorOptions) => Iterator
