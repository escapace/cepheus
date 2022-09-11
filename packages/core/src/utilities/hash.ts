import { createHash } from 'crypto'
import { isNumber } from 'lodash-es'

export const hash = (...data: Array<string | number>) =>
  createHash('sha512')
    .update(
      data.reduce<string>(
        (a, b): string => a.concat(isNumber(b) ? b.toString() : b),
        ''
      )
    )
    .digest('hex')
