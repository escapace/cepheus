import { createHash } from 'node:crypto'
import { isNumber } from 'lodash-es'

export const hash = (...data: Array<number | string>) =>
  createHash('sha512')
    .update(
      data.reduce<string>(
        (a, b): string => a.concat(isNumber(b) ? b.toString() : b),
        ''
      )
    )
    .digest('hex')
