export const parseAlpha = (value: string | undefined): number => {
  if (value === undefined) {
    return 1
  } else if (value.length > 1 && value.startsWith('0')) {
    return parseFloat('0.' + value.slice(1))
  }

  return value === '0' ? 0 : 1
}
