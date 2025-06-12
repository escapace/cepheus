import { describe, expect, it } from 'vitest'
import { parametricLogisticLift } from './parametric-logistic-lift'

// | x    | k = 10 | k = 20 | k = 40(initial)      | k = 80 |
// | ---- | -----: | -----: | -------------------: | -----: |
// | 0.00 | 0.0000 | 0.0000 | 0.0000               | 0.0000 |
// | 0.05 | 0.1168 | 0.1265 | 0.0964               | 0.0579 |
// | 0.10 | 0.2264 | 0.2729 | 0.2963               | 0.2999 |
// | 0.15 | 0.3192 | 0.3931 | 0.4575               | 0.4937 |
// | 0.20 | 0.3896 | 0.4594 | 0.4945               | 0.4999 |
// | 0.30 | 0.4674 | 0.4959 | 0.4999               | 0.5000 |
// | 0.40 | 0.4935 | 0.4997 | 0.5000               | 0.5000 |
// | 0.50 | 0.5000 | 0.5000 | 0.5000               | 0.5000 |

const referenceTable: Record<number, ReadonlyArray<[number, number]>> = {
  10: [
    [0, 0],
    [0.05, 0.1168],
    [0.1, 0.2264],
    [0.15, 0.3192],
    [0.2, 0.3896],
    [0.3, 0.4674],
    [0.4, 0.4935],
    [0.5, 0.5],
  ],
  20: [
    [0, 0],
    [0.05, 0.1265],
    [0.1, 0.2729],
    [0.15, 0.3931],
    [0.2, 0.4594],
    [0.3, 0.4959],
    [0.4, 0.4997],
    [0.5, 0.5],
  ],
  40: [
    // original implementation
    [0, 0],
    [0.05, 0.0964],
    [0.1, 0.2963],
    [0.15, 0.4575],
    [0.2, 0.4945],
    [0.3, 0.4999],
    [0.4, 0.5],
    [0.5, 0.5],
  ],
  80: [
    [0, 0],
    [0.05, 0.0579],
    [0.1, 0.2999],
    [0.15, 0.4937],
    [0.2, 0.4999],
    [0.3, 0.5],
    [0.4, 0.5],
    [0.5, 0.5],
  ],
}

// --- test-suite ------------------------------------------------------------
describe('parametricLogisticLift()', () => {
  it('clamps outside the domain [0 … 0.5]', () => {
    expect(parametricLogisticLift(-0.3)).toBe(0)
    expect(parametricLogisticLift(0)).toBe(0)
    expect(parametricLogisticLift(0.7)).toBe(0.5)
    expect(parametricLogisticLift(0.5)).toBe(0.5)
  })

  it('reproduces the shape when k = 40 (default)', () => {
    const legacyAt = [
      [0, 0],
      [0.05, 0.0964],
      [0.1, 0.2963],
      [0.15, 0.4575],
      [0.2, 0.4945],
      [0.3, 0.4999],
      [0.4, 0.5],
      [0.5, 0.5],
    ] as const

    for (const [x, expected] of legacyAt) {
      expect(parametricLogisticLift(x, 40)).toBeCloseTo(expected, 4)
    }
  })

  for (const [k, pairs] of Object.entries(referenceTable)) {
    it(`produces correct values for k = ${k}`, () => {
      for (const [x, expected] of pairs) {
        expect(parametricLogisticLift(x, Number(k))).toBeCloseTo(expected, 4)
      }
    })
  }

  it('is monotone-increasing on (0 , 0.5) for any reasonable k', () => {
    const ks = [5, 10, 20, 40, 80]
    const xs = Array.from({ length: 20 }, (_, index) => ((index + 1) * 0.5) / 20) // 0.025 … 0.5
    for (const k of ks) {
      for (let index = 1; index < xs.length; ++index) {
        const yPrevious = parametricLogisticLift(xs[index - 1], k)
        const y = parametricLogisticLift(xs[index], k)
        expect(y).toBeGreaterThanOrEqual(yPrevious)
      }
    }
  })

  it('gets steeper as k grows (spot-check at x = 0.15)', () => {
    const x = 0.15
    const y10 = parametricLogisticLift(x, 10)
    const y40 = parametricLogisticLift(x, 40)
    const y80 = parametricLogisticLift(x, 80)

    expect(y10).toBeLessThan(y40)
    expect(y40).toBeLessThan(y80)
  })

  it('never leaves the range [0, 0.5] for any x ∈ ℝ and any k > 0', () => {
    const ks = [1, 5, 20, 100]
    const xs = [-1, -0.01, 0, 0.1, 0.25, 0.49, 0.5, 0.6, 2]
    for (const k of ks) {
      for (const x of xs) {
        const y = parametricLogisticLift(x, k)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(0.5)
      }
    }
  })
})
