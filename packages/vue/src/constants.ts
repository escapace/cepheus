import { Interpolator } from 'cepheus'
import { InjectionKey } from 'vue'

export const INJECTION_KEY: InjectionKey<Interpolator> =
  Symbol.for('@cepheus/vue')
