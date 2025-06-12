import { DisplayP3, OKLCH, serialize, sRGB, type Vector } from '@texel/color'
import type { Iterator, StyleSheetPartial } from 'cassiopeia'
import { color } from './color'
import type { CreateIteratorOptions } from './types'
import { INTERPOLATOR } from 'cepheus'

const createStyleSheet = (
  variables: string[],
  options: CreateIteratorOptions,
): StyleSheetPartial | undefined => {
  if (variables.length === 0) {
    return undefined
  }

  let selector = ':where(:root,:host)'
  const media: string[] = []
  const supports: string[] = []

  if (options.colorSchemeStrategy === 'media') {
    media.push(`(prefers-color-scheme: ${options.colorScheme})`)
  } else {
    selector = `${selector}.${options.colorScheme}`
  }

  if (options.colorGamut !== 'srgb') {
    media.push(`(color-gamut: ${options.colorGamut})`)
  }

  if (options.colorFormat === 'oklch') {
    supports.push('(color: oklch(0% 0 0))')
  }

  if (options.colorFormat === 'p3') {
    supports.push('(color: color(display-p3 0 0 0))')
  }

  const mediaString = media.length === 0 ? undefined : media.join(' and ')

  const content = [
    mediaString === undefined ? undefined : `@media ${mediaString} {`,
    supports.length === 0 ? undefined : `@supports ${supports.join(' and ')} {`,
    `${selector} { ${variables.join(' ')} }`,
    supports.length === 0 ? undefined : `}`,
    mediaString === undefined ? undefined : `}`,
  ]
    .filter((value): value is string => value !== undefined)
    .join(' ')

  return { content, media: mediaString }
}

export function* createIterator(options: CreateIteratorOptions): Iterator {
  const variables: string[] = []

  const properties = {
    ...options,
    colorGamutMapping:
      options.colorGamut !== options.interpolator[INTERPOLATOR].state.palette.colorGamut,
  }

  let variable: string | true

  while ((variable = yield) !== true) {
    const coords = color(variable, properties)

    if (coords === undefined) {
      continue
    }

    const value = serialize(
      coords as Vector,
      OKLCH,
      properties.colorFormat === 'p3'
        ? DisplayP3
        : properties.colorFormat === 'oklch'
          ? OKLCH
          : sRGB,
    )

    variables.push(`${variable}: ${value};`)
  }

  return createStyleSheet(variables, properties)
}
