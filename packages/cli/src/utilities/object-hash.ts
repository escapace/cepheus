import { JSONType, objectSort } from './object-sort'
import { hash } from './hash'

export const objectHash = <T extends JSONType>(value: T): string =>
  hash(JSON.stringify(objectSort(value)))
