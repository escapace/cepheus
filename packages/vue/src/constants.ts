import type { ColorFunction } from '@cepheus/plugin'
import type { Interpolator } from 'cepheus'
import type { InjectionKey } from 'vue'

export const INJECTION_KEY_INTERPOLATOR: InjectionKey<Interpolator> = Symbol.for(
  '@cepheus/vue/interpolator',
)
export const INJECTION_KEY_COLORS: InjectionKey<
  Record<string, ColorFunction | [number, number, number] | undefined> | undefined
> = Symbol.for('@cepheus/vue/colors')
