import { chunk } from './chunk'
import { JSONModel, Model, Triangle } from './types'

export const parseJSONModel = (model: JSONModel): Model => {
  const [interval, length, _triangle, squares, data] = model
  const step = length * 3
  const triangle = [
    _triangle.slice(0, 2),
    _triangle.slice(2, 4),
    _triangle.slice(4, 6)
  ] as Triangle

  const colors = new Map(
    squares.map((square, index) => {
      return [
        square,
        chunk(data.slice(index * step, (index + 1) * step)) as Array<
          [number, number, number]
        >
      ]
    })
  )

  return {
    colors,
    interval,
    length,
    squares,
    triangle
  }
}
