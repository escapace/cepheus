import { inject } from 'vue'
import { INJECTION_KEY } from './constants'

export const useCepheus = () => {
  const interpolator = inject(INJECTION_KEY)

  if (interpolator === undefined) {
    throw new Error('Is vue cepheus plugin added?')
  }

  return interpolator
}
