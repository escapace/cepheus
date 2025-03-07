import type { Options as CepheusOptions } from '@cepheus/vue'
import 'vue/server-renderer'
import type { Preferences } from './types'

declare module 'vue/server-renderer' {
  export interface SSRContext {
    cepheus?: {
      preferences?: Preferences
    } & Pick<CepheusOptions, 'colorSchemeStrategy'>
    modules?: string[]
    teleports?: Record<string, string>
  }
}
