import { assert, describe, it } from 'vitest'
import { lerpAngle } from './lerp-angle'

describe('./src/lerp-angle.spec.ts', () => {
  describe('basic interpolation', () => {
    it('interpolates between two angles in the same quadrant', () => {
      assert.deepStrictEqual(lerpAngle(10, 20, 0.5), 15)
      assert.deepStrictEqual(lerpAngle(90, 120, 0.5), 105)
      assert.deepStrictEqual(lerpAngle(200, 250, 0.5), 225)
    })

    it('takes the shortest path between angles', () => {
      assert.deepStrictEqual(lerpAngle(350, 10, 0.5), 0)
      assert.deepStrictEqual(lerpAngle(10, 350, 0.5), 0)
      assert.deepStrictEqual(lerpAngle(320, 80, 0.5), 20)
      assert.deepStrictEqual(lerpAngle(80, 320, 0.5), 20)
    })
  })

  describe('t parameter behavior', () => {
    it('returns first angle when t=0', () => {
      assert.deepStrictEqual(lerpAngle(45, 135, 0), 45)
      assert.deepStrictEqual(lerpAngle(350, 10, 0), 350)
      assert.deepStrictEqual(lerpAngle(440, 320, 0), 80) // 440 normalized to 80
    })

    it('returns second angle when t=1', () => {
      assert.deepStrictEqual(lerpAngle(45, 135, 1), 135)
      assert.deepStrictEqual(lerpAngle(350, 10, 1), 10)
      assert.deepStrictEqual(lerpAngle(320, 80, 1), 80)
      assert.deepStrictEqual(lerpAngle(440, 320, 1), 320)
    })

    it('handles t values outside 0-1 range', () => {
      assert.deepStrictEqual(lerpAngle(0, 90, -0.5), 315) // extrapolates backward
      assert.deepStrictEqual(lerpAngle(0, 90, 1.5), 135) // extrapolates forward
      assert.deepStrictEqual(lerpAngle(350, 10, -0.5), 340)
      assert.deepStrictEqual(lerpAngle(350, 10, 1.5), 20)
    })
  })

  describe('angle normalization', () => {
    it('handles angles greater than 360', () => {
      assert.deepStrictEqual(lerpAngle(40, 380, 0.5), 30) // 380 = 20, shortest path is 40->20
      assert.deepStrictEqual(lerpAngle(450, 540, 0.5), 135) // 450=90, 540=180
      assert.deepStrictEqual(lerpAngle(720, 810, 0.5), 45) // 720=0, 810=90
    })

    it('handles negative angles', () => {
      assert.deepStrictEqual(lerpAngle(-45, 45, 0.5), 0)
      assert.deepStrictEqual(lerpAngle(-90, -45, 0.5), 292.5) // -90=270, -45=315
      assert.deepStrictEqual(lerpAngle(-180, 180, 0.5), 180) // both normalize to 180
    })

    it('handles mix of positive and negative angles', () => {
      assert.deepStrictEqual(lerpAngle(-10, 10, 0.5), 0)
      assert.deepStrictEqual(lerpAngle(350, -10, 0.5), 350) // -10 = 350, same angle
      assert.deepStrictEqual(lerpAngle(-170, 170, 0.5), 180)
    })
  })

  describe('wrap-around cases', () => {
    it('handles crossing 0/360 boundary', () => {
      assert.deepStrictEqual(lerpAngle(350, 10, 0.5), 0)
      assert.deepStrictEqual(lerpAngle(359, 1, 0.5), 0)
      assert.deepStrictEqual(lerpAngle(355, 5, 0.25), 357.5)
      assert.deepStrictEqual(lerpAngle(355, 5, 0.75), 2.5)
    })

    it('handles crossing 180 boundary', () => {
      assert.deepStrictEqual(lerpAngle(170, 190, 0.5), 180)
      assert.deepStrictEqual(lerpAngle(175, 185, 0.25), 177.5)
      assert.deepStrictEqual(lerpAngle(175, 185, 0.75), 182.5)
    })
  })

  describe('edge cases', () => {
    it('handles identical angles', () => {
      assert.deepStrictEqual(lerpAngle(45, 45, 0.5), 45)
      assert.deepStrictEqual(lerpAngle(0, 0, 0.7), 0)
      assert.deepStrictEqual(lerpAngle(360, 0, 0.3), 0) // 360 normalizes to 0
    })

    it('handles 180-degree differences', () => {
      assert.deepStrictEqual(lerpAngle(0, 180, 0.5), 90) // 180 degree difference, goes the long way
      assert.deepStrictEqual(lerpAngle(90, 270, 0.5), 180) // 90 to 270 = 180 degree difference, goes long way
      assert.deepStrictEqual(lerpAngle(45, 225, 0.5), 135) // 180 degree difference, goes long way
    })

    it('normalizes output to 0-360 range', () => {
      const result1 = lerpAngle(350, 370, 0.5) // 370 = 10
      assert.ok(result1 >= 0 && result1 < 360)

      const result2 = lerpAngle(-45, -90, 0.5)
      assert.ok(result2 >= 0 && result2 < 360)
    })
  })

  describe('precision', () => {
    it('maintains precision for fractional results', () => {
      assert.deepStrictEqual(lerpAngle(0, 90, 1 / 3), 30)
      assert.deepStrictEqual(lerpAngle(0, 360, 1 / 6), 0) // 360 normalizes to 0, so no movement
      assert.deepStrictEqual(lerpAngle(350, 10, 1 / 4), 355)
    })
  })
})
