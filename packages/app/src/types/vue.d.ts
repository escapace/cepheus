import 'vue/server-renderer'
import type { Preferences } from '../types'

declare module 'vue/server-renderer' {
  export interface SSRContext {
    cepheus?: {
      preferences?: Preferences
    }
    modules?: string[]
    teleports?: Record<string, string>
  }
}
