import { ColorSpace } from 'cepheus'
import { DEFAULT_WEIGHTS } from '../constants'
import { OptimizeOptions } from '../types'
import { optimize } from './optimize'

const CASE_A: OptimizeOptions = {
  colorSpace: ColorSpace.p3,
  weights: DEFAULT_WEIGHTS,
  randomSeed:
    '100bf1952a0373f672054096995f5d337938d5d2ee3d68a0264e7d3fcff0ff170e33516bf381d9ad66d91f632c6c515f804cda4d055406670c5071d3f03c8e6b',
  colors: [
    [[0.571320822154189, 0.19291358614127885, 257.10706767869505]],
    [[0.5836705602608081, 0.19607298879671345, 23.309004792244707]],
    [[0.674120729539391, 0.1547590571903533, 59.46375278223519]],
    [[0.5796152322520944, 0.1070820131122245, 166.45747253068203]]
  ],
  background: [[0.9999999934735462, 3.727399553519285e-8, 0]],
  lightness: { range: [25, 50], target: 37.5 },
  chroma: { range: [0, 25], target: 12.5 }
}

describe('./src/optimize.spec.ts', function () {
  this.timeout(20000)

  it('case-a', () => {
    const qwe = optimize(CASE_A)

    console.log(qwe)
  })
})
