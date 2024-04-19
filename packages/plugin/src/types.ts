export interface Options {
  darkMode?: 'class' | 'media'
  flags?: {
    colorFormat?: Array<'oklch' | 'p3' | 'srgb'>
    colorGamut?: Array<'p3' | 'srgb'>
    colorScheme?: Array<'dark' | 'light' | 'none'>
  }
}

export interface Flags {
  colorFormat: 'oklch' | 'p3' | 'srgb'
  colorGamut: 'p3' | 'srgb'
  colorScheme: 'dark' | 'light' | 'none'
}

export interface OptionsAdvanced extends Pick<Required<Options>, 'darkMode'> {
  flags: Flags[]
}
