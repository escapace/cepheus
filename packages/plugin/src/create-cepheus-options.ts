import { permutations } from './permutations'
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

export const createCepheusOptions = (
  options: { displayP3Support?: boolean } & Options,
): IteratorOptions => {
  let colorScheme: Array<'dark' | 'light' | undefined>
  let colorFormat: Array<'oklch' | 'p3' | 'srgb'>
  let colorGamut: Array<'p3' | 'srgb'>

  if (__PLATFORM__ === 'browser') {
    colorScheme = options.flags?.colorScheme ?? [undefined]

    colorFormat = intersection(
      filterKeys({
        oklch: CSS.supports('(color: oklch(0% 0 0))'),
        p3: CSS.supports('(color: color(display-p3 0 0 0))'),
        srgb: true,
      }),
      options.flags?.colorFormat,
    )

    colorGamut = intersection(
      options.displayP3Support === true ? ['p3', 'srgb'] : ['srgb'],
      options.flags?.colorGamut,
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
    colorScheme = options.flags?.colorScheme ?? ['light', 'dark']
    colorFormat = options.flags?.colorFormat ?? ['srgb']
    colorGamut = options.flags?.colorGamut ?? ['srgb']
  }

  const flags = permutations({
    colorFormat,
    colorGamut,
    colorScheme,
  }).filter(
    (flags) =>
      !(
        (flags.colorFormat === 'p3' && flags.colorGamut === 'srgb') ||
        (flags.colorFormat === 'srgb' && flags.colorGamut === 'p3')
      ),
  )

  if (flags.length === 0) {
    throw new Error('[cepheus]: incompatibe options.')
  }

  const colorSchemeStrategy = options.colorSchemeStrategy ?? 'media'

  return {
    colorSchemeStrategy,
    flags,
  }
}
