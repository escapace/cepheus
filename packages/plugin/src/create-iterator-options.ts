import { createCombinations } from './create-combinations'
import type { IteratorOptions, Options } from './types'

const filterKeys = <T extends string>(record: Record<T, boolean>): T[] => {
  const keys = Object.keys(record) as T[]

  return keys.filter<T>((key): key is T => record[key])
}

const intersection = <T extends string>(a: T[], b: T[] | undefined): T[] => {
  if (b === undefined) {
    return a
  }

  return a.filter((value) => b.includes(value))
}

export const createIteratorOptions = (
  options: { displayP3Support?: boolean } & Options,
): IteratorOptions => {
  let colorFormat: Array<'oklch' | 'p3' | 'srgb'>
  let colorGamut: Array<'p3' | 'srgb'>

  const colorScheme: Array<'dark' | 'light'> =
    options.colorScheme === undefined ? ['dark', 'light'] : [options.colorScheme]

  if (__PLATFORM__ === 'browser') {
    colorFormat = intersection(
      filterKeys({
        oklch: CSS.supports('(color: oklch(0% 0 0))'),
        p3: CSS.supports('(color: color(display-p3 0 0 0))'),
        srgb: true,
      }),
      options.colorFormat,
    )

    colorGamut = intersection(
      options.displayP3Support === true ? ['p3', 'srgb'] : ['srgb'],
      options.colorGamut,
    )

    if (colorFormat.includes('oklch')) {
      colorGamut = [colorGamut.includes('p3') ? 'p3' : 'srgb']
      colorFormat = ['oklch']
    } else if (colorGamut.includes('p3') && colorFormat.includes('p3')) {
      colorGamut = ['p3']
      colorFormat = ['p3']
    } else {
      colorGamut = ['srgb']
      colorFormat = ['srgb']
    }
  } else {
    colorFormat = options.colorFormat ?? ['srgb']
    colorGamut = options.colorGamut ?? ['srgb']
  }

  const combinations = createCombinations({
    colorFormat,
    colorGamut,
    colorScheme,
  })

  if (combinations.length === 0) {
    throw new Error('[cepheus]: incompatibe options.')
  }

  const colorSchemeStrategy =
    options.colorSchemeStrategy ?? (colorScheme.length === 2 ? 'media' : 'class')

  return {
    colorSchemeStrategy,
    combinations,
  }
}
