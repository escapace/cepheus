import { isArray, isPlainObject, range } from 'lodash-es'

export type JSONType =
  | string
  | number
  | boolean
  | null
  | JSONType[]
  | { [key: string]: JSONType }

/* const compare = (a: string, b: string): number =>  */

const sum = (string: string): number =>
  range(string.length)
    .map((index) => {
      const charCode = string.charCodeAt(index)

      return Number.isNaN(charCode) ? 0 : charCode
    })
    .reduce((a, b) => a + b)

export const objectSort = <T extends JSONType>(value: T): T => {
  if (isArray(value)) {
    return ([...value] as JSONType[]).map((item) => objectSort(item)) as T
  }

  if (isPlainObject(value)) {
    return Object.assign(
      {},
      ...Object.keys(value as { [key: string]: JSONType })
        .sort((a, b) => sum(a) - sum(b))
        .map((key) => ({
          [key]: objectSort((value as { [key: string]: JSONType })[key])
        }))
    ) as T
  }

  return value
}
