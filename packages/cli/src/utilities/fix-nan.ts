export const fixNaN = (color: [number, number, number]): [number, number, number] =>
  color.map((value) => (isNaN(value) ? 0 : value)) as [number, number, number]
