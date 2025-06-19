import { describe, expect, it } from 'vitest'
import { isPointInsideTriangle } from './is-point-inside-triangle'

describe('is-point-inside-triangle', () => {
  it('returns true for point inside triangle', () => {
    const triangle: [[number, number], [number, number], [number, number]] = [
      [0, 0],
      [10, 0],
      [5, 10],
    ]
    const point: [number, number] = [5, 3]

    expect(isPointInsideTriangle(point, triangle)).toBe(true)
  })

  it('returns false for point outside triangle', () => {
    const triangle: [[number, number], [number, number], [number, number]] = [
      [0, 0],
      [10, 0],
      [5, 10],
    ]
    const point: [number, number] = [15, 5]

    expect(isPointInsideTriangle(point, triangle)).toBe(false)
  })

  it('returns true for point on triangle vertex', () => {
    const triangle: [[number, number], [number, number], [number, number]] = [
      [0, 0],
      [10, 0],
      [5, 10],
    ]
    const point: [number, number] = [0, 0]

    expect(isPointInsideTriangle(point, triangle)).toBe(true)
  })

  it('returns true for point on triangle edge', () => {
    const triangle: [[number, number], [number, number], [number, number]] = [
      [0, 0],
      [10, 0],
      [5, 10],
    ]
    const point: [number, number] = [5, 0]

    expect(isPointInsideTriangle(point, triangle)).toBe(true)
  })

  it('handles negative coordinates', () => {
    const triangle: [[number, number], [number, number], [number, number]] = [
      [-5, -5],
      [5, -5],
      [0, 5],
    ]
    const point: [number, number] = [0, 0]

    expect(isPointInsideTriangle(point, triangle)).toBe(true)
  })

  it('returns false for point far outside triangle', () => {
    const triangle: [[number, number], [number, number], [number, number]] = [
      [0, 0],
      [10, 0],
      [5, 10],
    ]
    const point: [number, number] = [-10, -10]

    expect(isPointInsideTriangle(point, triangle)).toBe(false)
  })
})
