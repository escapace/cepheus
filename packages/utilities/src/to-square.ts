import { szudzik2 } from './szudzik'

export const toSquare = (
  position: [number, number],
  interval: number
): number =>
  szudzik2(...(position.map((v) => v / interval) as [number, number]))
