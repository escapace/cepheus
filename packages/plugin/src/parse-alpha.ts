export const parseAlpha = (value: string | undefined): number => {
  if (value === undefined) {
    return 1
  }

  if (value.length === 1) {
    return parseInt(value, 10)
  }

  return parseFloat('0.' + value.slice(1))
}
