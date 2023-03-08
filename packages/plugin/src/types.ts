export interface Options {
  darkMode?: 'class' | 'media'
  flags?: {
    colorFormat?: Array<'p3' | 'srgb' | 'oklch'>
    colorGamut?: Array<'srgb' | 'p3'>
    colorScheme?: Array<'light' | 'dark' | 'none'>
  }
}

export interface Flags {
  colorFormat: 'p3' | 'srgb' | 'oklch'
  colorGamut: 'srgb' | 'p3'
  colorScheme: 'light' | 'dark' | 'none'
}

export interface OptionsAdvanced extends Pick<Required<Options>, 'darkMode'> {
  flags: Flags[]
}
