export interface Options {
  colorSchemeStrategy?: 'class' | 'media'
  flags?: {
    colorFormat?: Array<'oklch' | 'p3' | 'srgb'>
    colorGamut?: Array<'p3' | 'srgb'>
    colorScheme?: Array<'dark' | 'light' | undefined>
  }
}

export interface Flags {
  colorFormat: 'oklch' | 'p3' | 'srgb'
  colorGamut: 'p3' | 'srgb'
  colorScheme: 'dark' | 'light' | undefined
}

export interface IteratorOptions extends Pick<Required<Options>, 'colorSchemeStrategy'> {
  flags: Flags[]
}
