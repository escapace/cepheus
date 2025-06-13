import { color, type ColorOptions } from '@cepheus/plugin'
import { computed, inject } from 'vue'
import { CEPHEUS_INJECTION_KEY } from './constants'

export const useColor = (
  options: { variable: string } & Pick<ColorOptions, 'colorGamut' | 'colorScheme'>,
) => {
  const cepheus = inject(CEPHEUS_INJECTION_KEY)

  if (cepheus === undefined) {
    throw new Error('Is vue cepheus plugin added?')
  }

  // TODO: default colorGamut & colorScheme

  return computed(() =>
    color(options.variable, {
      colorGamut: options.colorGamut,
      colors: cepheus.colors,
      colorScheme: options.colorScheme,
      interpolator: cepheus.interpolator,
    }),
  )
}
