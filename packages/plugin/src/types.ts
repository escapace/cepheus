export interface Options {
  colorSpaces?: Array<'p3' | 'srgb' | 'oklch'>
  colorGamut?: 'srgb' | 'p3'
  prefersColorScheme?: boolean
}

export interface IteratorOptions
  extends Required<Pick<Options, 'prefersColorScheme' | 'colorGamut'>> {
  p3: boolean
  srgb: boolean
  oklch: boolean
}
