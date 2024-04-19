import { ColorSpace } from 'cepheus'
import { DEFAULT_HUE_ANGLE, DEFAULT_WEIGHTS } from '../constants'
import type { OptimizeOptions } from '../types'
import { optimize } from './optimize'

const CASE_A: OptimizeOptions = {
  background: [[0.999_999_993_473_546_2, 3.727_399_553_519_285e-8, 0]],
  chroma: { range: [0, 25], target: 12.5 },
  colors: [
    [[0.571_320_822_154_189, 0.192_913_586_141_278_85, 257.107_067_678_695_05]],
    [
      [
        0.583_670_560_260_808_1, 0.196_072_988_796_713_45,
        23.309_004_792_244_707
      ]
    ],
    [[0.674_120_729_539_391, 0.154_759_057_190_353_3, 59.463_752_782_235_19]],
    [[0.579_615_232_252_094_4, 0.107_082_013_112_224_5, 166.457_472_530_682_03]]
  ],
  colorSpace: ColorSpace.p3,
  hueAngle: DEFAULT_HUE_ANGLE,
  lightness: { range: [25, 50], target: 37.5 },
  randomSeed:
    '100bf1952a0373f672054096995f5d337938d5d2ee3d68a0264e7d3fcff0ff170e33516bf381d9ad66d91f632c6c515f804cda4d055406670c5071d3f03c8e6b',
  weights: DEFAULT_WEIGHTS
}

describe('./src/optimize.spec.ts', function () {
  this.timeout(20_000)

  it('case-a', () => {
    const qwe = optimize(CASE_A)

    console.log(qwe)
  })
})
