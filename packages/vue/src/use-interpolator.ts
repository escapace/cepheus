import type { Interpolator } from 'cepheus'
import { inject } from 'vue'
import { CEPHEUS_INJECTION_KEY } from './constants'

export const useInterpolator = (): Interpolator => {
  const cepheus = inject(CEPHEUS_INJECTION_KEY)

  if (cepheus === undefined) {
    throw new Error('Is vue cepheus plugin added?')
  }

  return cepheus.interpolator
}
