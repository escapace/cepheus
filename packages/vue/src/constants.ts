import type { Interpolator } from 'cepheus'
import type { InjectionKey } from 'vue'

export const INJECTION_KEY: InjectionKey<Interpolator> =
  Symbol.for('@cepheus/vue')
