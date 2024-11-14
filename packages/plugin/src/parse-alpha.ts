export const parseAlpha = (value: string | undefined): number =>
  value === undefined ? 1 : parseInt(value) / 100
