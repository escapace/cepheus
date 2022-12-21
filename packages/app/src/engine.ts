const isSameDomain = (styleSheet: CSSStyleSheet): boolean => {
  if (styleSheet.href === null) {
    return true
  }

  return styleSheet.href.indexOf(window.location.origin) === 0
}

const isStylesheet = (node: Node) =>
  node.nodeName.toLowerCase() === 'link' &&
  ((node as Element)?.getAttribute('rel') ?? '').includes('stylesheet')

const isStyle = (node: Node) => node.nodeName.toLowerCase() === 'style'

const isSupportedCSSRule = (rule: CSSRule) =>
  // CSSRule.STYLE_RULE (1)
  rule.type === 1 ||
  // CSSRule.MEDIA_RULE (4)
  rule.type === 4 ||
  // CSSRule.PAGE_RULE (6)
  rule.type === 6 ||
  // CSSRule.KEYFRAME_RULE (8)
  rule.type === 8 ||
  // CSSRule.SUPPORTS_RULE (12)
  rule.type === 12

const reg = /var\(---([a-zA-Z0-9]+)-([a-zA-Z-0-9]+)\)/gm

function* createVariableIterator(): Generator<
  [string, string, string],
  void,
  true | undefined
> {
  const elements = document.querySelectorAll('*[style]')

  for (const element of elements) {
    const cssText = element.attributes.getNamedItem('style')?.value

    if (cssText !== undefined) {
      for (const match of cssText.matchAll(reg)) {
        const cancelled = yield match as [string, string, string]

        if (cancelled) {
          return
        }
      }
    }
  }

  for (const cssStyleSheet of document.styleSheets) {
    // TODO: exclude self style sheet using the ssr id
    if (isSameDomain(cssStyleSheet)) {
      for (const cssRule of cssStyleSheet.cssRules) {
        if (isSupportedCSSRule(cssRule)) {
          for (const match of cssRule.cssText.matchAll(reg)) {
            const cancelled = yield match as [string, string, string]

            if (cancelled) {
              return
            }
          }
        }
      }
    }
  }
}

const isValidMutation = (mutation: MutationRecord, state: State) => {
  if (mutation.target === state.styleElement) {
    return false
  }

  if (mutation.type === 'attributes') {
    if (mutation.target.nodeType === 1) {
      // console.log((mutation.target as HTMLElement).attributes.getNamedItem('style')?.value)
      // console.log((mutation.target as HTMLElement)?.style?.cssText)
    }

    return true
  } else if (mutation.type === 'characterData') {
    if (
      mutation.target.parentNode !== null &&
      isStyle(mutation.target.parentNode)
    ) {
      return true
    }
  } else if (mutation.type === 'childList') {
    for (const node of mutation.addedNodes) {
      if (isStylesheet(node)) {
        return true
      }

      if (isStyle(node)) {
        return true
      }
    }

    for (const node of mutation.removedNodes) {
      if (isStylesheet(node)) {
        return true
      }

      if (isStyle(node)) {
        return true
      }
    }
  }

  return false
}

const enum EngineState {
  Inactive,
  Activating,
  Active
}

interface State {
  updateState: UpdateState
  engineState: EngineState
  iterators: PluginIterators
  styleElement?: HTMLStyleElement
  matcher?: Matcher
}

// const add = (map: Map<string, Set<string>>, key: string, value: string) => {
//   let set: Set<string> | undefined
//
//   set = map.get(key)
//
//   if (set === undefined) {
//     set = new Set<string>()
//     map.set(key, set)
//   }
//
//   set.add(value)
// }

const cacheIterators = (values: PluginIterators) => {
  const object: Record<string, PluginIterator> = {}
  const cache: Map<string, PluginIterator | undefined> = new Map()

  for (const key of values.keys()) {
    Object.defineProperty(object, key, {
      get(): PluginIterator | undefined {
        if (cache.has(key)) {
          return cache.get(key)
        }

        const value = values.get(key)

        if (value === undefined) {
          cache.set(key, undefined)
          return
        }

        const generator = value()

        // A value passed to the first invocation of next() is always ignored.
        generator.next()

        cache.set(key, generator)

        return generator
      }
    })
  }

  return [object, cache] as const
}

function* createMatcher(state: State): Matcher {
  const seen = new Set<string>()
  const variables = createVariableIterator()
  const [iterators, iteratorCache] = cacheIterators(state.iterators)

  let cancelled = false

  for (const [id, key, variable] of variables) {
    if (cancelled) {
      break
    }

    if (seen.has(id)) {
      continue
    }

    seen.add(id)

    const plugin = iterators[key]

    if (plugin === undefined) {
      continue
    }

    plugin.next(variable)
    cancelled = (yield) === true
  }

  variables.next(true)

  if (cancelled) {
    for (const iterator of iteratorCache.values()) {
      if (iterator !== undefined) {
        iterator.next(true)
      }
    }

    return
  }

  let accumulator = ''

  for (const iterator of iteratorCache.values()) {
    if (iterator !== undefined) {
      const { done, value } = iterator.next(true)

      if (done === true && value !== undefined) {
        accumulator += value
      }
    }
  }

  return accumulator
}

type Matcher = Generator<undefined, string | undefined, true | undefined>
export type PluginIterator = Generator<
  undefined,
  string | undefined,
  string | true
>

type Update = () => void
type Deregister = () => void
type PluginIterators = Map<string, () => PluginIterator>

export interface Plugin {
  register: (iterators: PluginIterators, update: Update) => void
  deregister: Deregister
}

const enum UpdateState {
  None,
  Scheduled,
  Running
}

const createUpdate = (state: State) => (): void => {
  if (
    state.engineState === EngineState.Inactive ||
    state.updateState === UpdateState.Scheduled
  ) {
    return
  } else if (state.updateState === UpdateState.Running) {
    state.updateState = UpdateState.None

    if (state.matcher !== undefined) {
      state.matcher.next(true)
      state.matcher = undefined
    }
  }

  state.updateState = UpdateState.Scheduled

  requestAnimationFrame(() => {
    if (state.updateState === UpdateState.Scheduled) {
      state.updateState = UpdateState.Running

      const matcher = (state.matcher = createMatcher(state))

      const next = (): void => {
        if (state.updateState === UpdateState.Running) {
          const cursor = matcher.next()

          if (cursor.done !== true) {
            setTimeout(next)
            return
          }

          if (cursor.value !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            state.styleElement!.innerHTML = cursor.value
            state.updateState = UpdateState.None
          }
        }
      }

      setTimeout(next)
    }
  })
}

export const createEngine = (plugins: Plugin[]) => {
  const state: State = {
    updateState: UpdateState.None,
    engineState: EngineState.Inactive,
    styleElement: undefined,
    iterators: new Map(),
    matcher: undefined
  }

  const update = createUpdate(state)

  const mutationObserver = new MutationObserver((mutations) => {
    if (state.engineState !== EngineState.Active) {
      return
    }

    if (mutations.some((mutation) => isValidMutation(mutation, state))) {
      update()
    }
  })

  const observe = () => {
    if (state.engineState === EngineState.Active) return

    const target: HTMLElement | undefined =
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      document.documentElement || document.body

    if (target === undefined) {
      return
    }

    mutationObserver.observe(target, {
      attributes: true,
      // characterData: true,
      // characterDataOldValue: false,
      attributeOldValue: false,
      attributeFilter: ['style'],
      subtree: true,
      childList: true
    })

    state.engineState = EngineState.Active
  }

  const init = () => {
    if (state.engineState === EngineState.Activating) {
      if (state.styleElement !== undefined) {
        state.styleElement = document.createElement('style')
        document.documentElement.prepend(state.styleElement)
      }

      if (state.iterators.size !== 0) {
        state.iterators.clear()
      }

      plugins.forEach((values) => values.register(state.iterators, update))

      update()
      observe()
    }
  }

  const resume = () => {
    if (state.engineState === EngineState.Inactive) {
      state.engineState = EngineState.Activating

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init)
      } else {
        init()
      }
    }
  }

  const pause = () => {
    if (state.engineState !== EngineState.Inactive) {
      state.engineState = EngineState.Inactive

      mutationObserver.disconnect()
      plugins.forEach((value) => value.deregister())
    }
  }

  resume()

  return {
    resume,
    pause,
    isActive: () => state.engineState === EngineState.Active
  }
}
