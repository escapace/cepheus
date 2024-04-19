import type { Options as CepheusOptions } from '@cepheus/vue'
import 'vue/server-renderer'
import type { Preferences } from './types'

declare module 'vue/server-renderer' {
  export interface SSRContext {
    cepheus?: {
      preferences?: Preferences
    } & Omit<CepheusOptions, 'state'>
    modules?: string[]
    teleports?: Record<string, string>
  }
}
