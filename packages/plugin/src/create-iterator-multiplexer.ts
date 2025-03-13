import type { Iterator, StyleSheetPartial } from 'cassiopeia'

// eslint-disable-next-line typescript/no-explicit-any
export const createIteratorMultiplexer = <T extends (...arguments_: any) => Iterator>(
  factory: T,
  options: Array<Parameters<T>[0]>,
): (() => Iterator) =>
  function* wrapper(): Iterator {
    const iterators = options.map((value) => {
      const iterator = factory(value)
      // A value passed to the first invocation of next() is always ignored.
      iterator.next()
      return iterator
    })

    let cursor: string | true

    while ((cursor = yield) !== true) {
      for (const iterator of iterators) {
        iterator.next(cursor)
      }
    }

    const accumulator: StyleSheetPartial[] = []

    for (const [index, iterator] of iterators.entries()) {
      const { done, value } = iterator.next(true)

      if (done === true && value !== undefined) {
        accumulator.push({
          ...(value as StyleSheetPartial),
          index,
        })
      }
    }

    return accumulator
  }
