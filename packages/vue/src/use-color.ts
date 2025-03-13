import { color, type ColorOptions } from '@cepheus/plugin'
import { computed, inject } from 'vue'
import { INJECTION_KEY_COLORS, INJECTION_KEY_INTERPOLATOR } from './constants'

export const useColor = (
  options: { variable: string } & Pick<ColorOptions, 'colorGamut' | 'colorScheme'>,
) => {
  const interpolator = inject(INJECTION_KEY_INTERPOLATOR)
  const colors = inject(INJECTION_KEY_COLORS)

  if (interpolator === undefined) {
    throw new Error('Is vue cepheus plugin added?')
  }

  // TODO: default colorGamut & colorScheme

  return computed(() =>
    color(options.variable, {
      colorGamut: options.colorGamut,
      colors,
      colorScheme: options.colorScheme,
      interpolator,
    }),
  )
}
