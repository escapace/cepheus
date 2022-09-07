export const relativeDifference = (
  a: number,
  b: number,
  min: number,
  max: number
) => (Math.abs(a - b) / b) * (b / (max - min))
