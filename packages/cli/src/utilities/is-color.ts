import type { Color } from '../types'

export const isColor = (value: unknown): value is Color =>
  Array.isArray(value) &&
  value.length === 3 &&
  value.every((value) => typeof value === 'number' && !isNaN(value) && Number.isFinite(value))
