export const relativeDifference = (
  a: number,
  b: number,
  min: number,
  max: number
) => {
  if (a === b && b === min && min === max) {
    return 0
  }

  const _a = Math.min(a, b)
  const _b = Math.max(a, b)

  if (_a === 0 && _b === 0) {
    return 0
  }

  const maxmin = max - min

  return (Math.abs(_a - _b) / _b) * (_b / maxmin)
}
