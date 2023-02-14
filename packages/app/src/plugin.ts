/* eslint-disable @typescript-eslint/method-signature-style */
import {
  cassiopeia as c,
  STORE,
  TypeState,
  type Options,
  type Variables
} from 'cassiopeia'
import {
  inject,
  onScopeDispose,
  type App,
  type InjectionKey,
  type Plugin
} from 'vue'

export interface CassiopeiaInjection {
  createScope: () => {
    add(variable: string[]): string[]
    add(variable: string): string
    clear: () => void
    delete: (variable: string) => void
    dispose: () => void
  }
  update: (isAsync?: boolean) => void
}

const INJECTION_KEY_CASSIOPEIA: InjectionKey<CassiopeiaInjection> = Symbol(
  'INJECTION_KEY_CASSIOPEIA'
)

export const REGEX = /^---([a-zA-Z0-9]+)-([a-zA-Z-0-9]+)$/

function* createVariableIterator(sets: Set<Set<string>>): Variables {
  for (const set of sets) {
    for (const string of set) {
      const match = string.match(REGEX)

      if (match?.length === 3) {
        const cancelled = yield match.slice(0, 3) as [string, string, string]

        if (cancelled) {
          return
        }
      }
    }
  }
}

export const cassiopeia = (options: Omit<Options, 'source'>): Plugin => {
  const sets: Set<Set<string>> = new Set()

  const createVariables = () => createVariableIterator(sets)

  const instance = c({ ...options, source: undefined })

  const update = (isAsync?: boolean) => {
    if (instance[STORE].state === TypeState.Active) {
      instance.update(createVariables, isAsync)
    }
  }

  const createScope = () => {
    const set = new Set<string>()
    sets.add(set)

    function add(value: string): string
    function add(value: string[]): string[]
    function add(value: string | string[]): string | string[] {
      ;(Array.isArray(value) ? value : [value]).forEach((value) => {
        if (!set.has(value)) {
          set.add(value)
        }
      })

      return value
    }

    const clear = () => {
      set.clear()
    }

    const dispose = () => {
      clear()
      sets.delete(set)
    }

    const del = (variable: string) => {
      set.delete(variable)
    }

    return { add, clear, delete: del, dispose }
  }

  instance.subscribe((value) => {
    let styleElement =
      (document.querySelector(`style[cassiopeia=true]`) as
        | HTMLStyleElement
        | undefined) ?? undefined

    if (styleElement === undefined) {
      styleElement = document.createElement('style')
      styleElement.setAttribute('cassiopeia', 'true')

      document.head.insertBefore(styleElement, null)
    }

    styleElement.innerHTML = value
  })

  return {
    install: (app: App) => {
      instance.start()

      app.provide(INJECTION_KEY_CASSIOPEIA, { createScope, update })
    }
  }
}

export const useCassiopeia = () => {
  const cassiopeia = inject(INJECTION_KEY_CASSIOPEIA)

  if (cassiopeia === undefined) {
    throw new Error('bla')
  }

  const scope = cassiopeia.createScope()

  onScopeDispose(scope.dispose)

  return { update: cassiopeia.update, ...scope }
}
