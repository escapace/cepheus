import { unszudzik2 } from './szudzik'

export const toPosition = (
  square: number,
  interval: number
): [number, number] =>
  unszudzik2(square).map((v) => v * interval) as [number, number]
