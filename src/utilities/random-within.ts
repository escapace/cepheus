export const randomWithin = (
  min: number,
  max: number,
  randomSource: () => number
) => randomSource() * (max - min) + min
