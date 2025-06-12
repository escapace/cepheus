import type { Palette } from './types'

export const alias = (palette: Palette, alias?: Palette['alias']): Palette => ({
  ...palette,
  alias,
})
