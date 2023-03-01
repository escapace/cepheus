import { BigNumber } from 'bignumber.js'

export const toPrecision = (value: number, precision = 12) =>
  Number.isFinite(precision)
    ? parseFloat(new BigNumber(value).toPrecision(precision))
    : value
