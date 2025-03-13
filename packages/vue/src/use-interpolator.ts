import { inject } from 'vue'
import { INJECTION_KEY_INTERPOLATOR } from './constants'

export const useInterpolator = () => {
  const interpolator = inject(INJECTION_KEY_INTERPOLATOR)

  if (interpolator === undefined) {
    throw new Error('Is vue cepheus plugin added?')
  }

  return interpolator
}
