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

const isSupportedCSSRule = (rule: CSSRule): boolean => {
  const name = rule.constructor.name

  return (
    name === 'CSSStyleRule' ||
    name === 'CSSMediaRule' ||
    name === 'CSSPageRule' ||
    name === 'CSSKeyframesRule' ||
    name === 'CSSSupportsRule'
  )
}

const reg = /var\(---([a-zA-Z0-9]+)-([a-zA-Z-0-9]+)\)/gm

// let customElem = document.querySelector('my-shadow-dom-element')!
// let shadow = customElem.shadowRoot!;
// let styleSheets = shadow.styleSheets;

function* createVariableIterator(
  root: Document | ShadowRoot
): Generator<[string, string, string], void, true | undefined> {
  const elements = root.querySelectorAll('*[style]')

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

  for (const cssStyleSheet of root.styleSheets) {
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
  root: Document | ShadowRoot
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
  const variables = createVariableIterator(state.root)
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

export type Plugin = () => {
  register: (iterators: PluginIterators, update: Update) => void
  deregister: Deregister
}

const enum UpdateState {
  Locked,
  None,
  Scheduled,
  Running
}

function schedulerTask(matcher: Matcher, state: State): void {
  if (matcher === state.matcher && state.updateState === UpdateState.Running) {
    const cursor = matcher.next()

    if (cursor.done !== true) {
      setTimeout(() => schedulerTask(matcher, state))
      return
    }

    if (cursor.value !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.styleElement!.textContent = cursor.value
    }

    state.updateState = UpdateState.None
    state.matcher = undefined
  } else {
    /* matcher has been updated or the state has changed, garbage collect */
    matcher.next(true)
  }
}

function schedulerFrame(state: State) {
  if (state.updateState === UpdateState.Scheduled) {
    const matcher = (state.matcher = createMatcher(state))
    state.updateState = UpdateState.Running

    schedulerTask(matcher, state)
  }
}

function createScheduler(state: State) {
  const boundSchedulerFrame = schedulerFrame.bind(null, state)

  const lock = (lock: boolean) => {
    state.matcher = undefined

    state.updateState = lock ? UpdateState.Locked : UpdateState.None
  }

  const update = () => {
    if (state.updateState === UpdateState.Running) {
      state.matcher = undefined
      state.updateState = UpdateState.None
    }

    if (state.updateState === UpdateState.None) {
      state.updateState = UpdateState.Scheduled
      requestAnimationFrame(boundSchedulerFrame)
    }
  }

  return { update, lock }
}

const createMutationObserver = (state: State, update: () => void) => {
  const mutationObserver = new MutationObserver((mutations) => {
    if (state.engineState !== EngineState.Active) {
      return
    }

    if (mutations.some((mutation) => isValidMutation(mutation, state))) {
      update()
    }
  })

  const start = () => {
    if (state.engineState === EngineState.Active) return

    mutationObserver.observe(state.root, {
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

  return { start, stop: () => mutationObserver.disconnect() }
}

interface Options {
  root?: Document | ShadowRoot
}

export const isDocument = (value: Document | ShadowRoot): value is Document =>
  value.nodeType === 9

const createStyleElement = (root: Document | ShadowRoot): HTMLStyleElement => {
  let styleElement =
    (root.querySelector('style[cassiopeia=true]') as
      | HTMLStyleElement
      | undefined) ?? undefined

  if (styleElement === undefined) {
    styleElement = document.createElement('style')
    styleElement.setAttribute('cassiopeia', 'true')

    if (isDocument(root)) {
      root.head.insertBefore(styleElement, null)
    } else {
      root.appendChild(styleElement)
    }
  }

  return styleElement
}

export const createEngine = (plugin: Plugin[], options: Options = {}) => {
  const plugins = plugin.map((value) => value())

  const state: State = {
    updateState: UpdateState.Locked,
    engineState: EngineState.Inactive,
    styleElement: undefined,
    iterators: new Map(),
    matcher: undefined,
    root: options.root ?? document
  }

  const scheduler = createScheduler(state)
  const observer = createMutationObserver(state, scheduler.update)

  const init = () => {
    if (state.engineState === EngineState.Activating) {
      state.styleElement = state.styleElement ?? createStyleElement(state.root)

      plugins.forEach((values) =>
        values.register(state.iterators, scheduler.update)
      )

      scheduler.lock(false)
      scheduler.update()
      observer.start()
    }
  }

  const pause = () => {
    if (state.engineState !== EngineState.Inactive) {
      state.engineState = EngineState.Inactive

      observer.stop()
      scheduler.lock(true)
      plugins.forEach((value) => value.deregister())
      state.iterators.clear()
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

  resume()

  return {
    resume,
    pause,
    isActive: () => state.engineState === EngineState.Active
  }
}
