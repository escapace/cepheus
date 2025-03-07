export const fixNaN = (
  color: [number | null, number | null, number | null],
): [number, number, number] =>
  color.map((value) => (value === null || isNaN(value) ? 0 : value)) as [number, number, number]
