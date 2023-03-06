import { sum } from './sum'

export const normalize = (values: number[]): number[] => {
  const s = sum(values)

  return values.map((value) => value / s)
}
