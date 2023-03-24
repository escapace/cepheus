import { Options as CepheusOptions } from '@cepheus/vue'
import 'vue/server-renderer'
import { Preferences } from './types'

declare module 'vue/server-renderer' {
  export interface SSRContext {
    modules?: string[]
    teleports?: Record<string, string>
    cepheus?: Omit<CepheusOptions, 'state'> & {
      preferences?: Preferences
    }
  }
}
