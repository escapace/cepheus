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

const REGEX = /var\(---([a-zA-Z0-9]+)-([a-zA-Z-0-9]+)\)/gm

function* createVariableIterator(
  root: Document | ShadowRoot
): Generator<[string, string, string], void, true | undefined> {
  const elements = root.querySelectorAll('*[style]')

  for (const element of elements) {
    const cssText = element.attributes.getNamedItem('style')?.value

    if (cssText !== undefined) {
      for (const match of cssText.matchAll(REGEX)) {
        const cancelled = yield match as [string, string, string]

        if (cancelled) {
          return
        }
      }
    }
  }

  for (const cssStyleSheet of root.styleSheets) {
    if (
      cssStyleSheet.ownerNode instanceof Element &&
      cssStyleSheet.ownerNode.getAttribute('cassiopeia') !== null
    ) {
      continue
    }

    if (isSameDomain(cssStyleSheet)) {
      for (const cssRule of cssStyleSheet.cssRules) {
        if (isSupportedCSSRule(cssRule)) {
          for (const match of cssRule.cssText.matchAll(REGEX)) {
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

const isValidMutation = (mutation: MutationRecord, store: Store) => {
  if (mutation.target === store.styleElement) {
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

const cacheIterators = (values: Iterators) => {
  const object: Record<string, Iterator> = {}
  const cache: Map<string, Iterator | undefined> = new Map()

  for (const key of values.keys()) {
    Object.defineProperty(object, key, {
      get(): Iterator | undefined {
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

function* createMatcher(
  root: ShadowRoot | Document,
  iterators: Iterators
): Matcher {
  const seen = new Set<string>()
  const variables = createVariableIterator(root)
  const [iteratorsRecord, iteratorsMap] = cacheIterators(iterators)

  let cancelled = false

  for (const [id, key, variable] of variables) {
    if (cancelled) {
      break
    }

    if (seen.has(id)) {
      continue
    }

    seen.add(id)

    const iterator = iteratorsRecord[key]

    if (iterator === undefined) {
      continue
    }

    iterator.next(variable)
    cancelled = (yield) === true
  }

  if (cancelled) {
    for (const iterator of iteratorsMap.values()) {
      if (iterator !== undefined) {
        iterator.next(true)
      }
    }

    return
  }

  let accumulator = ''

  for (const iterator of iteratorsMap.values()) {
    if (iterator !== undefined) {
      const { done, value } = iterator.next(true)

      if (done === true && value !== undefined) {
        accumulator += value
      }
    }
  }

  return accumulator
}

export type Iterator = Generator<undefined, string | undefined, string | true>
export type Deregister = () => void
export type Iterators = Map<string, () => Iterator>
export type Register = (iterators: Iterators, update: () => void) => void
export type Plugin = () => {
  register: Register
  deregister: Deregister
}

type Matcher = Generator<undefined, string | undefined, true | undefined>

interface Store {
  id: string
  iterators: Iterators
  matcher?: Matcher
  root: Document | ShadowRoot
  state: TypeState
  styleElement?: HTMLStyleElement
  update: TypeUpdate
}

const enum TypeState {
  Inactive,
  Activating,
  Active
}

const enum TypeUpdate {
  Locked,
  None,
  Scheduled,
  Running
}

function schedulerTask(matcher: Matcher, store: Store): void {
  if (matcher === store.matcher && store.update === TypeUpdate.Running) {
    const cursor = matcher.next()

    if (cursor.done !== true) {
      setTimeout(() => schedulerTask(matcher, store))
      return
    }

    if (cursor.value !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      store.styleElement!.textContent = cursor.value
    }

    store.update = TypeUpdate.None
    store.matcher = undefined
  } else {
    /* matcher has been updated or the state has changed, garbage collect */
    matcher.next(true)
  }
}

function schedulerFrame(store: Store) {
  if (store.update === TypeUpdate.Scheduled) {
    const matcher = (store.matcher = createMatcher(store.root, store.iterators))
    store.update = TypeUpdate.Running

    schedulerTask(matcher, store)
  }
}

function createScheduler(store: Store) {
  const boundSchedulerFrame = schedulerFrame.bind(null, store)

  const lock = (lock: boolean) => {
    store.matcher = undefined

    store.update = lock ? TypeUpdate.Locked : TypeUpdate.None
  }

  const update = () => {
    if (store.update === TypeUpdate.Running) {
      store.matcher = undefined
      store.update = TypeUpdate.None
    }

    if (store.update === TypeUpdate.None) {
      store.update = TypeUpdate.Scheduled
      requestAnimationFrame(boundSchedulerFrame)
    }
  }

  return { update, lock }
}

const createMutationObserver = (store: Store, update: () => void) => {
  const mutationObserver = new MutationObserver((mutations) => {
    if (store.state !== TypeState.Active) {
      return
    }

    if (mutations.some((mutation) => isValidMutation(mutation, store))) {
      update()
    }
  })

  const start = () => {
    if (store.state === TypeState.Active) return

    mutationObserver.observe(store.root, {
      attributes: true,
      // characterData: true,
      // characterDataOldValue: false,
      attributeOldValue: false,
      attributeFilter: ['style'],
      subtree: true,
      childList: true
    })

    store.state = TypeState.Active
  }

  return { start, stop: () => mutationObserver.disconnect() }
}

const isDocument = (value: Document | ShadowRoot): value is Document =>
  value.nodeType === 9

const createStyleElement = (
  id: string,
  root: Document | ShadowRoot
): HTMLStyleElement => {
  let styleElement =
    (root.querySelector(`style[cassiopeia=${id}]`) as
      | HTMLStyleElement
      | undefined) ?? undefined

  if (styleElement === undefined) {
    styleElement = document.createElement('style')
    styleElement.setAttribute('cassiopeia', id)

    if (isDocument(root)) {
      root.head.insertBefore(styleElement, null)
    } else {
      root.appendChild(styleElement)
    }
  }

  return styleElement
}

interface Options {
  id?: string
  root?: Document | ShadowRoot
  plugins: Plugin[]
}

export interface Cassiopeia {
  resume: () => void
  pause: () => void
  isActive: () => boolean
}

export function cassiopeia(options: Options): Cassiopeia {
  const plugins = options.plugins.map((value) => value())

  const store: Store = {
    update: TypeUpdate.Locked,
    state: TypeState.Inactive,
    styleElement: undefined,
    iterators: new Map(),
    matcher: undefined,
    root: options.root ?? document,
    id: options.id ?? 'true'
  }

  const scheduler = createScheduler(store)
  const observer = createMutationObserver(store, scheduler.update)

  const init = () => {
    if (store.state === TypeState.Activating) {
      store.styleElement =
        store.styleElement ?? createStyleElement(store.id, store.root)

      plugins.forEach((values) =>
        values.register(store.iterators, scheduler.update)
      )

      scheduler.lock(false)
      scheduler.update()
      observer.start()
    }
  }

  const pause = () => {
    if (store.state !== TypeState.Inactive) {
      store.state = TypeState.Inactive

      observer.stop()
      scheduler.lock(true)
      plugins.forEach((value) => value.deregister())
      store.iterators.clear()
    }
  }

  const resume = () => {
    if (store.state === TypeState.Inactive) {
      store.state = TypeState.Activating

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
    isActive: () => store.state === TypeState.Active
  }
}
