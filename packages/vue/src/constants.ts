import type { InjectionKey } from 'vue'
import type { Cepheus } from './create-cepheus'

export const CEPHEUS_INJECTION_KEY: InjectionKey<Cepheus> = Symbol.for('@cepheus/vue')
