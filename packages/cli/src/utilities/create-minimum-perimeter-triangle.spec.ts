import { toSquare } from '@cepheus/utilities'
import { describe, expect, it } from 'vitest'
import { SIDE_LENGTH } from '../constants'
import { createMinimumPerimeterTriangle } from './create-minimum-perimeter-triangle'

describe('create-minimum-perimeter-triangle', () => {
  it('.', () => {
    const interval = SIDE_LENGTH / 4

    const positions: Array<[number, number]> = [
      [0, 0],
      [30, 0],
      [60, 0],
      [90, 0],
      [30, 30],
      [60, 30],
      [60, 60],
    ]

    const squares = positions.map((value) => toSquare(value, interval))

    expect(createMinimumPerimeterTriangle(squares, interval)).toMatchSnapshot()
  })
})
